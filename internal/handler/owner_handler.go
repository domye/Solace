package handler

import (
	"gin-quickstart/internal/service"
	"github.com/gin-gonic/gin"
)

// OwnerHandler 站长处理器
type OwnerHandler struct {
	ownerService service.OwnerService
}

// NewOwnerHandler 创建站长处理器
func NewOwnerHandler(ownerService service.OwnerService) *OwnerHandler {
	return &OwnerHandler{ownerService: ownerService}
}

// GetOwner 获取站长信息
// @Summary 获取站长公开信息
// @Tags owner
// @Produce json
// @Success 200 {object} Response
// @Router /owner [get]
func (h *OwnerHandler) GetOwner(c *gin.Context) {
	owner, err := h.ownerService.GetOwner(c.Request.Context())
	if err != nil {
		RespondWithError(c, err)
		return
	}
	RespondWithSuccess(c, owner)
}
