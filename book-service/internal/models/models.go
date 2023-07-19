package models

type Book struct {
	Id        int       `json:"id"`
	AuthorIds []int     `json:"-" gorm:"-:all"`
	Authors   []*Author `json:"authors,omitempty" gorm:"-:all"`
	TagIds    []int     `json:"-" gorm:"-:all"`
	Tags      []int     `json:"tags,omitempty" gorm:"-:all"`
	Title     string    `json:"title"`
	Subtitle  string    `json:"subtitle"`
	CoverUrl  string    `json:"cover_url"`
}

type Author struct {
	Id   int    `json:"id"`
	Name string `json:"name,omitempty"`
}

type Tag struct {
	Id    int    `json:"id"`
	Value string `json:"value"`
}

type BookAuthorMapping struct {
	BookId   int
	AuthorId int
}

type BookTagMapping struct {
	BookId int
	TagId  int
}
