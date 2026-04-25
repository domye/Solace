package middleware

import (
	"bytes"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestLoggingPreservesNonMultipartRequestBody(t *testing.T) {
	gin.SetMode(gin.TestMode)

	wantBody := string(bytes.Repeat([]byte("a"), 8192))
	router := gin.New()
	router.Use(LoggingWithConfig(LoggingConfig{
		LogRequestBody: true,
		MaxBodySize:    4096,
	}))
	router.POST("/echo", func(c *gin.Context) {
		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.String(http.StatusInternalServerError, err.Error())
			return
		}
		c.String(http.StatusOK, string(body))
	})

	request := httptest.NewRequest(http.MethodPost, "/echo", bytes.NewBufferString(wantBody))
	request.Header.Set("Content-Type", "text/plain")
	response := httptest.NewRecorder()

	router.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("response status = %d, want %d", response.Code, http.StatusOK)
	}
	if response.Body.String() != wantBody {
		t.Fatalf("response body length = %d, want %d", response.Body.Len(), len(wantBody))
	}
}

func TestLoggingDoesNotConsumeMultipartRequestBody(t *testing.T) {
	gin.SetMode(gin.TestMode)

	var requestBody bytes.Buffer
	writer := multipart.NewWriter(&requestBody)
	part, err := writer.CreateFormFile("image", "image.png")
	if err != nil {
		t.Fatalf("CreateFormFile() error = %v", err)
	}
	if _, err := part.Write(bytes.Repeat([]byte("a"), 8192)); err != nil {
		t.Fatalf("part.Write() error = %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("writer.Close() error = %v", err)
	}

	router := gin.New()
	router.Use(LoggingWithConfig(LoggingConfig{
		LogRequestBody: true,
		MaxBodySize:    4096,
	}))
	router.POST("/upload", func(c *gin.Context) {
		file, _, err := c.Request.FormFile("image")
		if err != nil {
			c.String(http.StatusBadRequest, err.Error())
			return
		}
		defer file.Close()

		c.Status(http.StatusNoContent)
	})

	request := httptest.NewRequest(http.MethodPost, "/upload", &requestBody)
	request.Header.Set("Content-Type", writer.FormDataContentType())
	response := httptest.NewRecorder()

	router.ServeHTTP(response, request)

	if response.Code != http.StatusNoContent {
		t.Fatalf("response status = %d, want %d; body = %q", response.Code, http.StatusNoContent, response.Body.String())
	}
}
