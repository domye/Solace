package errors

import (
	"net/http"
)

// AppError 应用错误接口
type AppError interface {
	Error() string
	Code() string
	HTTPStatus() int
	Details() interface{}
}

// appError 基础错误实现
type appError struct {
	code       string
	message    string
	httpStatus int
	details    interface{}
}

func (e *appError) Error() string {
	return e.message
}

func (e *appError) Code() string {
	return e.code
}

func (e *appError) HTTPStatus() int {
	return e.httpStatus
}

func (e *appError) Details() interface{} {
	return e.details
}

// 常用预定义错误
var (
	ErrUnauthorized = &appError{
		code:       "UNAUTHORIZED",
		message:    "需要身份验证",
		httpStatus: http.StatusUnauthorized,
	}

	ErrForbidden = &appError{
		code:       "FORBIDDEN",
		message:    "访问被拒绝",
		httpStatus: http.StatusForbidden,
	}
)

// NewBadRequest 创建错误请求错误
func NewBadRequest(message string, details interface{}) AppError {
	return &appError{
		code:       "BAD_REQUEST",
		message:    message,
		httpStatus: http.StatusBadRequest,
		details:    details,
	}
}

// NewUnauthorized 创建未授权错误
func NewUnauthorized(message string) AppError {
	return &appError{
		code:       "UNAUTHORIZED",
		message:    message,
		httpStatus: http.StatusUnauthorized,
	}
}

func NewNotFound(message string) AppError {
	return &appError{
		code:       "NOT_FOUND",
		message:    message,
		httpStatus: http.StatusNotFound,
	}
}

func IsAppError(err error) bool {
	_, ok := err.(AppError)
	return ok
}
