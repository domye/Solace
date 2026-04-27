package service

import (
	stderrors "errors"
	"strings"

	"gin-quickstart/internal/pkg/errors"
	"github.com/jackc/pgx/v5/pgconn"
)

var ErrArticleSlugConflict = errors.NewConflict(
	"文章链接已存在，请修改标题或自定义 slug 后重试",
	map[string]string{"field": "slug"},
)

func isArticleSlugConflict(err error) bool {
	if err == nil {
		return false
	}

	var pgErr *pgconn.PgError
	if stderrors.As(err, &pgErr) {
		return pgErr.Code == "23505" && pgErr.ConstraintName == "articles_slug_key"
	}

	return strings.Contains(err.Error(), "articles_slug_key")
}
