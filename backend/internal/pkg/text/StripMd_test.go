package text

import "testing"

func TestGenerateSummaryRemovesMarkdownImageSyntax(t *testing.T) {
	summary := GenerateSummary("![alt](https://img.example/a.png)", 100)

	if summary != "" {
		t.Fatalf("GenerateSummary() = %q, want empty string", summary)
	}
}

func TestGenerateSummaryPreservesLinksWhileRemovingImages(t *testing.T) {
	summary := GenerateSummary("Read [guide](https://x) ![thumb](https://y)", 100)

	if summary != "Read guide" {
		t.Fatalf("GenerateSummary() = %q, want %q", summary, "Read guide")
	}
}

func TestTruncateTextReturnsEmptyForNegativeMaxLength(t *testing.T) {
	truncated := TruncateText("abc", -1)

	if truncated != "" {
		t.Fatalf("TruncateText() = %q, want empty string", truncated)
	}
}
