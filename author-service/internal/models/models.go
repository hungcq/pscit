package models

type Author struct {
	Id   int    `json:"id"`
	Name string `json:"name,omitempty"`
}
