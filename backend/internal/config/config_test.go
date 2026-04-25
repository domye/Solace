package config

import "testing"

func TestUploadConfigDefaults(t *testing.T) {
	t.Setenv("UPLOAD_DIR", "")
	t.Setenv("IMGBED_ENDPOINT", "")
	t.Setenv("IMGBED_TOKEN", "")
	t.Setenv("IMGBED_FIELD", "")
	t.Setenv("IMGBED_UPLOAD_FOLDER", "")

	cfg := &Config{}

	if got := cfg.UploadDir(); got != "uploads" {
		t.Fatalf("UploadDir() = %q, want %q", got, "uploads")
	}

	if got := cfg.ImgBedField(); got != "file" {
		t.Fatalf("ImgBedField() = %q, want %q", got, "file")
	}
}

func TestUploadConfigTrimsValues(t *testing.T) {
	t.Setenv("UPLOAD_DIR", "")
	t.Setenv("IMGBED_ENDPOINT", "")
	t.Setenv("IMGBED_TOKEN", "")
	t.Setenv("IMGBED_FIELD", "")
	t.Setenv("IMGBED_UPLOAD_FOLDER", "")

	cfg := &Config{
		Upload: UploadConfig{
			Dir: " /tmp/uploads ",
			ImgBed: ImgBedConfig{
				Endpoint:     " https://example.com/upload ",
				Token:        " secret-token ",
				Field:        " image-file ",
				UploadFolder: " Blog/文章图片 ",
			},
		},
	}

	if got := cfg.UploadDir(); got != "/tmp/uploads" {
		t.Fatalf("UploadDir() = %q, want %q", got, "/tmp/uploads")
	}

	if got := cfg.ImgBedEndpoint(); got != "https://example.com/upload" {
		t.Fatalf("ImgBedEndpoint() = %q, want %q", got, "https://example.com/upload")
	}

	if got := cfg.ImgBedToken(); got != "secret-token" {
		t.Fatalf("ImgBedToken() = %q, want %q", got, "secret-token")
	}

	if got := cfg.ImgBedField(); got != "image-file" {
		t.Fatalf("ImgBedField() = %q, want %q", got, "image-file")
	}

	if got := cfg.ImgBedUploadFolder(); got != "Blog/文章图片" {
		t.Fatalf("ImgBedUploadFolder() = %q, want %q", got, "Blog/文章图片")
	}
}

func TestUploadConfigEnvironmentOverrides(t *testing.T) {
	t.Setenv("UPLOAD_DIR", " /env/uploads ")
	t.Setenv("IMGBED_ENDPOINT", " https://env.example/upload ")
	t.Setenv("IMGBED_TOKEN", " env-token ")
	t.Setenv("IMGBED_FIELD", " env-file ")
	t.Setenv("IMGBED_UPLOAD_FOLDER", " Env/Blog ")

	cfg := &Config{
		Upload: UploadConfig{
			Dir: " /tmp/uploads ",
			ImgBed: ImgBedConfig{
				Endpoint: " https://example.com/upload ",
				Token:    " secret-token ",
				Field:    " image-file ",
			},
		},
	}

	if got := cfg.UploadDir(); got != "/env/uploads" {
		t.Fatalf("UploadDir() = %q, want %q", got, "/env/uploads")
	}

	if got := cfg.ImgBedEndpoint(); got != "https://env.example/upload" {
		t.Fatalf("ImgBedEndpoint() = %q, want %q", got, "https://env.example/upload")
	}

	if got := cfg.ImgBedToken(); got != "env-token" {
		t.Fatalf("ImgBedToken() = %q, want %q", got, "env-token")
	}

	if got := cfg.ImgBedField(); got != "env-file" {
		t.Fatalf("ImgBedField() = %q, want %q", got, "env-file")
	}

	if got := cfg.ImgBedUploadFolder(); got != "Env/Blog" {
		t.Fatalf("ImgBedUploadFolder() = %q, want %q", got, "Env/Blog")
	}
}
