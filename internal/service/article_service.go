package service

import (
	"context"
	"errors"
	"sort"
	"strings"
	"time"

	"gorm.io/gorm"

	"gin-quickstart/internal/dto/response"
	"gin-quickstart/internal/model"
	"gin-quickstart/internal/pkg/slug"
)

var (
	ErrArticleNotFound        = errors.New("文章未找到")
	ErrArticleNotAuthorized   = errors.New("无权修改此文章")
	ErrArticleVersionConflict = errors.New("文章版本冲突，请刷新后重试")
	ErrArticleAlreadyDeleted  = errors.New("文章已被删除")
	ErrCategoryNotFound       = errors.New("分类未找到")
	ErrCategoryHasArticles    = errors.New("分类下存在文章，无法删除")
	ErrTagNotFound            = errors.New("标签未找到")
	ErrTagAlreadyExists       = errors.New("标签已存在")
)

// ArticleService 文章业务逻辑接口
type ArticleService interface {
	Create(ctx context.Context, title, articleSlug, content, summary, coverImage string, categoryID *uint, tagIDs []uint, status string, authorID uint) (*response.ArticleResponse, error)
	GetByID(ctx context.Context, id uint) (*response.ArticleResponse, error)
	GetBySlug(ctx context.Context, slug string) (*response.ArticleResponse, error)
	GetList(ctx context.Context, page, pageSize int, status string, authorID *uint, categorySlug, tagSlug string) (*response.ArticleListResponse, error)
	GetArchive(ctx context.Context) (*response.ArchiveResponse, error)
	Search(ctx context.Context, query string, page, pageSize int) (*response.ArticleListResponse, error)
	Update(ctx context.Context, id uint, userID uint, version int, title, articleSlug, content, summary, coverImage string, categoryID *uint, tagIDs []uint, status string) (*response.ArticleResponse, error)
	Delete(ctx context.Context, id uint, userID uint) error
}

// articleRepository 文章数据访问接口
type articleRepository interface {
	FindByID(ctx context.Context, id uint) (*model.Article, error)
	FindBySlug(ctx context.Context, slug string) (*model.Article, error)
	FindAll(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*model.Article, int64, error)
	FindPublished(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*model.Article, int64, error)
	FindByCategory(ctx context.Context, categorySlug string, limit, offset int) ([]*model.Article, int64, error)
	FindByTag(ctx context.Context, tagSlug string, limit, offset int) ([]*model.Article, int64, error)
	FindBySlugWithNav(ctx context.Context, slug string) (*model.Article, *model.Article, *model.Article, error)
	GetArchive(ctx context.Context) ([]*model.Article, error)
	Search(ctx context.Context, query string, limit, offset int) ([]*model.Article, int64, error)
	Create(ctx context.Context, article *model.Article) error
	CreateWithTags(ctx context.Context, article *model.Article, tagIDs []uint) error
	Update(ctx context.Context, article *model.Article) error
	UpdateWithTags(ctx context.Context, article *model.Article, tagIDs []uint) error
	Delete(ctx context.Context, id uint) error
	IncrementViewCount(ctx context.Context, id uint) error
}

// categoryRepository 分类数据访问接口
type categoryRepository interface {
	FindByID(ctx context.Context, id uint) (*model.Category, error)
	FindBySlug(ctx context.Context, slug string) (*model.Category, error)
	FindAllWithCount(ctx context.Context) ([]*model.CategoryWithCount, error)
	Create(ctx context.Context, category *model.Category) error
	Update(ctx context.Context, category *model.Category) error
	Delete(ctx context.Context, id uint) error
	ExistsBySlug(ctx context.Context, slug string) bool
	CountArticles(ctx context.Context, categoryID uint) int
}

// tagRepository 标签数据访问接口
type tagRepository interface {
	FindByID(ctx context.Context, id uint) (*model.Tag, error)
	FindBySlug(ctx context.Context, slug string) (*model.Tag, error)
	FindByIDs(ctx context.Context, ids []uint) ([]*model.Tag, error)
	FindAllWithCount(ctx context.Context) ([]*model.TagWithCount, error)
	Create(ctx context.Context, tag *model.Tag) error
	Update(ctx context.Context, tag *model.Tag) error
	Delete(ctx context.Context, id uint) error
	ExistsBySlug(ctx context.Context, slug string) bool
	ExistsByName(ctx context.Context, name string) bool
	CountArticles(ctx context.Context, tagID uint) int
}

// articleService 文章服务实现
type articleService struct {
	articleRepo  articleRepository
	categoryRepo categoryRepository
	tagRepo      tagRepository
}

// NewArticleService 创建文章服务
func NewArticleService(articleRepo articleRepository, categoryRepo categoryRepository, tagRepo tagRepository) ArticleService {
	return &articleService{
		articleRepo:  articleRepo,
		categoryRepo: categoryRepo,
		tagRepo:      tagRepo,
	}
}

func (s *articleService) Create(ctx context.Context, title, articleSlug, content, summary, coverImage string, categoryID *uint, tagIDs []uint, status string, authorID uint) (*response.ArticleResponse, error) {
	// 验证分类是否存在
	if categoryID != nil {
		if _, err := s.categoryRepo.FindByID(ctx, *categoryID); err != nil {
			return nil, ErrCategoryNotFound
		}
	}

	// 验证标签是否存在
	if len(tagIDs) > 0 {
		tags, err := s.tagRepo.FindByIDs(ctx, tagIDs)
		if err != nil || len(tags) != len(tagIDs) {
			return nil, ErrTagNotFound
		}
	}

	// 生成或使用自定义 slug
	finalSlug := articleSlug
	if finalSlug == "" {
		// 没有提供 slug，从标题自动生成
		finalSlug = slug.Generate(title)
	}
	// 检查 slug 唯一性，如果冲突则添加时间戳
	existing, err := s.articleRepo.FindBySlug(ctx, finalSlug)
	if err == nil && existing != nil {
		finalSlug = slug.GenerateWithTimestamp(title)
	}

	now := time.Now()
	article := &model.Article{
		Title:      title,
		Slug:       finalSlug,
		Content:    content,
		Summary:    summary,
		CoverImage: coverImage,
		AuthorID:   authorID,
		CategoryID: categoryID,
		Status:     status,
		Version:    1,
	}

	// 如果状态为已发布，设置发布时间
	if status == model.StatusPublished {
		article.PublishedAt = &now
	}

	// 创建文章（含标签关联）
	if len(tagIDs) > 0 {
		if err := s.articleRepo.CreateWithTags(ctx, article, tagIDs); err != nil {
			return nil, err
		}
	} else {
		if err := s.articleRepo.Create(ctx, article); err != nil {
			return nil, err
		}
	}

	// 获取带关联信息的文章
	article, err = s.articleRepo.FindByID(ctx, article.ID)
	if err != nil {
		return nil, err
	}

	return toArticleResponse(article, nil, nil), nil
}

func (s *articleService) GetByID(ctx context.Context, id uint) (*response.ArticleResponse, error) {
	article, err := s.articleRepo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrArticleNotFound
		}
		return nil, err
	}

	// 异步增加浏览量
	go func() {
		_ = s.articleRepo.IncrementViewCount(context.Background(), id)
	}()

	return toArticleResponse(article, nil, nil), nil
}

func (s *articleService) GetBySlug(ctx context.Context, articleSlug string) (*response.ArticleResponse, error) {
	article, prev, next, err := s.articleRepo.FindBySlugWithNav(ctx, articleSlug)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrArticleNotFound
		}
		return nil, err
	}

	// 异步增加浏览量
	go func() {
		_ = s.articleRepo.IncrementViewCount(context.Background(), article.ID)
	}()

	return toArticleResponse(article, prev, next), nil
}

func (s *articleService) GetList(ctx context.Context, page, pageSize int, status string, authorID *uint, categorySlug, tagSlug string) (*response.ArticleListResponse, error) {
	offset := (page - 1) * pageSize
	var articles []*model.Article
	var total int64
	var err error

	// 根据筛选条件获取文章
	if categorySlug != "" {
		articles, total, err = s.articleRepo.FindByCategory(ctx, categorySlug, pageSize, offset)
	} else if tagSlug != "" {
		articles, total, err = s.articleRepo.FindByTag(ctx, tagSlug, pageSize, offset)
	} else if status == "" || status == model.StatusPublished {
		// 公开接口只返回已发布文章
		filters := make(map[string]interface{})
		if authorID != nil {
			filters["author_id"] = *authorID
		}
		articles, total, err = s.articleRepo.FindPublished(ctx, pageSize, offset, filters)
	} else {
		// 管理接口返回所有状态
		filters := make(map[string]interface{})
		filters["status"] = status
		if authorID != nil {
			filters["author_id"] = *authorID
		}
		articles, total, err = s.articleRepo.FindAll(ctx, pageSize, offset, filters)
	}

	if err != nil {
		return nil, err
	}

	items := make([]*response.ArticleSummary, len(articles))
	for i, article := range articles {
		items[i] = toArticleSummary(article)
	}

	return &response.ArticleListResponse{
		Items:    items,
		Page:     page,
		PageSize: pageSize,
		Total:    total,
	}, nil
}

func (s *articleService) GetArchive(ctx context.Context) (*response.ArchiveResponse, error) {
	articles, err := s.articleRepo.GetArchive(ctx)
	if err != nil {
		return nil, err
	}

	// 按年份分组
	yearMap := make(map[int]*response.ArchiveGroup)

	for _, article := range articles {
		if article.PublishedAt == nil {
			continue
		}

		year := article.PublishedAt.Year()

		// 初始化年份组
		if _, ok := yearMap[year]; !ok {
			yearMap[year] = &response.ArchiveGroup{
				Year:  year,
				Count: 0,
				Posts: []*response.ArticleSummary{},
			}
		}

		// 添加文章
		yearMap[year].Posts = append(yearMap[year].Posts, toArticleSummary(article))
		yearMap[year].Count++
	}

	// 转换为响应格式（按年份降序）
	groups := make([]*response.ArchiveGroup, 0, len(yearMap))
	for _, yearGroup := range yearMap {
		groups = append(groups, yearGroup)
	}
	// 按年份降序排序
	sort.Slice(groups, func(i, j int) bool {
		return groups[i].Year > groups[j].Year
	})

	return &response.ArchiveResponse{Groups: groups}, nil
}

func (s *articleService) Search(ctx context.Context, query string, page, pageSize int) (*response.ArticleListResponse, error) {
	offset := (page - 1) * pageSize

	articles, total, err := s.articleRepo.Search(ctx, query, pageSize, offset)
	if err != nil {
		return nil, err
	}

	items := make([]*response.ArticleSummary, len(articles))
	for i, article := range articles {
		items[i] = toArticleSummary(article)
	}

	return &response.ArticleListResponse{
		Items:    items,
		Page:     page,
		PageSize: pageSize,
		Total:    total,
	}, nil
}

func (s *articleService) Update(ctx context.Context, id uint, userID uint, version int, title, articleSlug, content, summary, coverImage string, categoryID *uint, tagIDs []uint, status string) (*response.ArticleResponse, error) {
	article, err := s.articleRepo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrArticleNotFound
		}
		return nil, err
	}

	// 检查权限
	if article.AuthorID != userID {
		return nil, ErrArticleNotAuthorized
	}

	// 乐观锁检查
	if article.Version != version {
		return nil, ErrArticleVersionConflict
	}

	// 验证分类是否存在
	if categoryID != nil && *categoryID != 0 {
		if _, err := s.categoryRepo.FindByID(ctx, *categoryID); err != nil {
			return nil, ErrCategoryNotFound
		}
	}

	// 更新字段
	if title != "" {
		article.Title = title
	}
	// 更新 slug（仅当提供了新 slug 时）
	if articleSlug != "" {
		newSlug := slug.Generate(articleSlug)
		if newSlug != article.Slug {
			// 检查新 slug 是否已被其他文章使用
			existing, err := s.articleRepo.FindBySlug(ctx, newSlug)
			if err == nil && existing != nil && existing.ID != article.ID {
				newSlug = slug.GenerateWithTimestamp(articleSlug)
			}
			article.Slug = newSlug
		}
	}
	if content != "" {
		article.Content = content
	}
	if summary != "" {
		article.Summary = summary
	}
	if coverImage != "" {
		article.CoverImage = coverImage
	}

	// 处理分类
	if categoryID != nil {
		if *categoryID == 0 {
			article.CategoryID = nil
		} else {
			article.CategoryID = categoryID
		}
	}

	// 处理状态变更
	if status != "" && status != article.Status {
		article.Status = status
		if status == model.StatusPublished && article.PublishedAt == nil {
			now := time.Now()
			article.PublishedAt = &now
		}
	}

	// 递增版本号
	article.Version++

	// 更新文章（含标签关联）
	if tagIDs != nil {
		if err := s.articleRepo.UpdateWithTags(ctx, article, tagIDs); err != nil {
			return nil, err
		}
	} else {
		if err := s.articleRepo.Update(ctx, article); err != nil {
			return nil, err
		}
	}

	// 获取更新后的文章
	article, err = s.articleRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return toArticleResponse(article, nil, nil), nil
}

func (s *articleService) Delete(ctx context.Context, id uint, userID uint) error {
	article, err := s.articleRepo.FindByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrArticleNotFound
		}
		return err
	}

	// 检查权限
	if article.AuthorID != userID {
		return ErrArticleNotAuthorized
	}

	return s.articleRepo.Delete(ctx, id)
}

// calculateWordCount 计算字数（简单实现）
func calculateWordCount(content string) int {
	// 移除空白字符后计算
	return len(strings.TrimSpace(content))
}

// calculateReadTime 计算阅读时间（分钟）
func calculateReadTime(wordCount int) int {
	// 假设每分钟阅读 300 字
	readTime := wordCount / 300
	if readTime < 1 {
		return 1
	}
	return readTime
}

func toArticleResponse(article *model.Article, prev, next *model.Article) *response.ArticleResponse {
	wordCount := calculateWordCount(article.Content)
	readTime := calculateReadTime(wordCount)

	resp := &response.ArticleResponse{
		ID:          article.ID,
		Title:       article.Title,
		Slug:        article.Slug,
		Content:     article.Content,
		Summary:     article.Summary,
		CoverImage:  article.CoverImage,
		AuthorID:    article.AuthorID,
		Status:      article.Status,
		ViewCount:   article.ViewCount,
		IsTop:       article.IsTop,
		Version:     article.Version,
		WordCount:   wordCount,
		ReadTime:    readTime,
		PublishedAt: article.PublishedAt,
		CreatedAt:   article.CreatedAt,
		UpdatedAt:   article.UpdatedAt,
	}

	if article.Author != nil {
		resp.Author = toUserResponse(article.Author)
	}

	if article.Category != nil {
		resp.Category = &response.CategoryResponse{
			ID:   article.Category.ID,
			Name: article.Category.Name,
			Slug: article.Category.Slug,
		}
	}

	if len(article.Tags) > 0 {
		resp.Tags = make([]*response.TagResponse, len(article.Tags))
		for i, tag := range article.Tags {
			resp.Tags[i] = &response.TagResponse{
				ID:   tag.ID,
				Name: tag.Name,
				Slug: tag.Slug,
			}
		}
	}

	if prev != nil {
		resp.Prev = &response.ArticleNav{
			Title: prev.Title,
			Slug:  prev.Slug,
		}
	}

	if next != nil {
		resp.Next = &response.ArticleNav{
			Title: next.Title,
			Slug:  next.Slug,
		}
	}

	return resp
}

func toArticleSummary(article *model.Article) *response.ArticleSummary {
	var author *response.UserResponse
	if article.Author != nil {
		author = toUserResponse(article.Author)
	}

	return &response.ArticleSummary{
		ID:          article.ID,
		Title:       article.Title,
		Slug:        article.Slug,
		Summary:     article.Summary,
		CoverImage:  article.CoverImage,
		Status:      article.Status,
		ViewCount:   article.ViewCount,
		PublishedAt: article.PublishedAt,
		CreatedAt:   article.CreatedAt,
		Author:      author,
		Category:    toCategorySummary(article.Category),
		Tags:        toTagSummaries(article.Tags),
	}
}

func toCategorySummary(category *model.Category) *response.CategoryResponse {
	if category == nil {
		return nil
	}
	return &response.CategoryResponse{
		ID:   category.ID,
		Name: category.Name,
		Slug: category.Slug,
	}
}

func toTagSummaries(tags []model.Tag) []*response.TagResponse {
	if len(tags) == 0 {
		return nil
	}
	result := make([]*response.TagResponse, len(tags))
	for i, tag := range tags {
		result[i] = &response.TagResponse{
			ID:   tag.ID,
			Name: tag.Name,
			Slug: tag.Slug,
		}
	}
	return result
}
