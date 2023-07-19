package outbound

import (
	"book-service/internal/models"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
)

type AuthorServiceAccess struct {
}

func (service *AuthorServiceAccess) GetAuthorsByIds(authorIds []int) ([]*models.Author, error) {
	var idStrings []string
	for _, e := range authorIds {
		idStrings = append(idStrings, strconv.Itoa(e))
	}
	url := fmt.Sprintf("http://localhost:81/authors/%s", strings.Join(idStrings, ","))
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Add("Accept", `application/json`)

	res, err := httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	body, err := io.ReadAll(res.Body)
	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("req error %v, status %d", req, res.StatusCode)
	}
	var authors []*models.Author
	err = json.Unmarshal(body, &authors)
	return authors, err
}
