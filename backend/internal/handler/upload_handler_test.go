package handler

import "testing"

func TestExtractImgBedURL(t *testing.T) {
	tests := []struct {
		name    string
		baseURL string
		body    string
		want    string
	}{
		{
			name:    "imgbed array absolute src",
			baseURL: "https://img.example/upload?returnFormat=full",
			body:    `[{"src":"https://img.example/file/example.png"}]`,
			want:    "https://img.example/file/example.png",
		},
		{
			name:    "imgbed array relative src",
			baseURL: "https://img.example/upload?returnFormat=default",
			body:    `[{"src":"/file/example.png"}]`,
			want:    "https://img.example/file/example.png",
		},
		{
			name:    "data url object",
			baseURL: "https://img.example/upload",
			body:    `{"data":{"url":"https://img.example/file/example.png"}}`,
			want:    "https://img.example/file/example.png",
		},
		{
			name:    "url object",
			baseURL: "https://img.example/upload",
			body:    `{"url":"https://img.example/file/example.png"}`,
			want:    "https://img.example/file/example.png",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := extractImgBedURL([]byte(tt.body), tt.baseURL)
			if err != nil {
				t.Fatalf("extractImgBedURL() error = %v", err)
			}

			if got != tt.want {
				t.Fatalf("extractImgBedURL() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestExtractImgBedURLRejectsInsecureURL(t *testing.T) {
	_, err := extractImgBedURL([]byte(`[{"src":"http://img.example/file/example.png"}]`), "https://img.example/upload")
	if err == nil {
		t.Fatal("extractImgBedURL() error = nil, want error")
	}
}

func TestExtractImgBedURLRejectsDifferentHost(t *testing.T) {
	_, err := extractImgBedURL([]byte(`[{"src":"https://evil.example/file/example.png"}]`), "https://img.example/upload")
	if err == nil {
		t.Fatal("extractImgBedURL() error = nil, want error")
	}
}

func TestImgBedEndpointWithFolder(t *testing.T) {
	got, err := imgBedEndpointWithFolder("https://img.example/upload?returnFormat=full&uploadFolder=Old", "Blog/文章图片")
	if err != nil {
		t.Fatalf("imgBedEndpointWithFolder() error = %v", err)
	}

	want := "https://img.example/upload?returnFormat=full&uploadFolder=Blog%2F%E6%96%87%E7%AB%A0%E5%9B%BE%E7%89%87"
	if got != want {
		t.Fatalf("imgBedEndpointWithFolder() = %q, want %q", got, want)
	}
}

func TestValidateImgBedEndpoint(t *testing.T) {
	host, err := validateImgBedEndpoint("https://img.example/upload")
	if err != nil {
		t.Fatalf("validateImgBedEndpoint() error = %v", err)
	}
	if host != "img.example" {
		t.Fatalf("validateImgBedEndpoint() = %q, want %q", host, "img.example")
	}
}

func TestValidateImgBedEndpointRejectsHTTP(t *testing.T) {
	_, err := validateImgBedEndpoint("http://img.example/upload")
	if err == nil {
		t.Fatal("validateImgBedEndpoint() error = nil, want error")
	}
}
