package utils

import (
	"fmt"
	"strconv"
)

func StringToUint(s string) (uint, error) {
	if s == "" {
		return 0, fmt.Errorf("empty string cannot be converted to uint")
	}

	val, err := strconv.ParseUint(s, 10, 0)
	if err != nil {
		return 0, fmt.Errorf("failed to convert '%s' to uint: %w", s, err)
	}

	return uint(val), nil
}
