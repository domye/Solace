package validator

import (
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
)

var validate *validator.Validate

func init() {
	validate = validator.New()
	validate.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]
		if name == "-" {
			return ""
		}
		return name
	})
}

func ValidateStruct(s interface{}) error {
	return validate.Struct(s)
}

func FormatError(err error) string {
	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		var msgs []string
		for _, e := range validationErrors {
			msgs = append(msgs, formatFieldError(e))
		}
		return strings.Join(msgs, "; ")
	}
	return err.Error()
}

func formatFieldError(e validator.FieldError) string {
	field := e.Field()
	switch e.Tag() {
	case "required":
		return field + "为必填项"
	case "min":
		return field + "最小值为" + e.Param()
	case "max":
		return field + "最大值为" + e.Param()
	case "email":
		return field + "格式无效"
	case "oneof":
		return field + "必须为以下值之一: " + e.Param()
	case "url":
		return field + "必须为有效的URL"
	default:
		return field + "验证失败: " + e.Tag()
	}
}
