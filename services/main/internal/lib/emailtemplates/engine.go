package emailtemplates

import (
	"bytes"
	"embed"
	"fmt"
	"html"
	"html/template"
	"io/fs"
	"regexp"
	"strings"

	"github.com/Bendomey/rent-loop/services/main/internal/config"
)

//go:embed templates
var templateFS embed.FS

// BaseEmailData holds global values injected into every template automatically.
type BaseEmailData struct {
	SupportEmail             string
	SupportPhone             string
	WebsiteURL               string
	AdminPortalURL           string
	PropertyManagerPortalURL string
	TenantPortalURL          string
}

// templateContext is the root object passed to html/template.Execute.
// Templates access global values via {{.Base.X}} and specific data via {{.Data.X}}.
type templateContext struct {
	Base BaseEmailData
	Data any
}

// Engine parses all embedded email templates at startup and renders them on demand.
type Engine struct {
	templates map[string]*template.Template
	base      BaseEmailData
}

// New parses all embedded templates and returns a ready-to-use Engine.
// Returns an error if any template fails to parse — fail-fast at startup.
func New(cfg config.Config) (*Engine, error) {
	e := &Engine{
		templates: make(map[string]*template.Template),
		base: BaseEmailData{
			SupportEmail:             cfg.SupportData.Email,
			SupportPhone:             cfg.SupportData.Phone,
			WebsiteURL:               cfg.Portals.WebsiteURL,
			AdminPortalURL:           cfg.Portals.AdminPortalURL,
			PropertyManagerPortalURL: cfg.Portals.PropertyManagerPortalURL,
			TenantPortalURL:          cfg.Portals.TenantPortalURL,
		},
	}

	if err := e.parseAll(); err != nil {
		return nil, err
	}

	return e, nil
}

func (e *Engine) parseAll() error {
	return fs.WalkDir(templateFS, "templates", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() || path == "templates/layout.html" || !strings.HasSuffix(path, ".html") {
			return nil
		}

		t, parseErr := template.ParseFS(templateFS, "templates/layout.html", path)
		if parseErr != nil {
			return fmt.Errorf("parsing email template %s: %w", path, parseErr)
		}

		name := strings.TrimPrefix(path, "templates/")
		name = strings.TrimSuffix(name, ".html")
		e.templates[name] = t

		return nil
	})
}

// Render executes the named template and returns HTML and plain-text versions.
func (e *Engine) Render(templateName string, data any) (htmlBody, textBody string, err error) {
	t, ok := e.templates[templateName]
	if !ok {
		return "", "", fmt.Errorf("email template %q not found", templateName)
	}

	ctx := templateContext{Base: e.base, Data: data}

	var buf bytes.Buffer
	if err = t.Execute(&buf, ctx); err != nil {
		return "", "", fmt.Errorf("executing email template %s: %w", templateName, err)
	}

	htmlBody = buf.String()
	textBody = htmlToText(htmlBody)

	return htmlBody, textBody, nil
}

var (
	tagRe        = regexp.MustCompile(`<[^>]+>`)
	whitespaceRe = regexp.MustCompile(`[ \t]+`)
	blankLinesRe = regexp.MustCompile(`\n{3,}`)
)

// htmlToText strips HTML tags and normalizes whitespace for the plain-text fallback.
func htmlToText(src string) string {
	s := strings.ReplaceAll(src, "</p>", "\n\n")
	s = strings.ReplaceAll(s, "</div>", "\n")
	s = strings.ReplaceAll(s, "<br>", "\n")
	s = strings.ReplaceAll(s, "<br/>", "\n")
	s = strings.ReplaceAll(s, "<br />", "\n")
	s = strings.ReplaceAll(s, "</tr>", "\n")
	s = strings.ReplaceAll(s, "</li>", "\n")
	s = strings.ReplaceAll(s, "</h1>", "\n\n")
	s = strings.ReplaceAll(s, "</h2>", "\n\n")
	s = strings.ReplaceAll(s, "</h3>", "\n\n")
	s = tagRe.ReplaceAllString(s, "")
	s = html.UnescapeString(s)

	lines := strings.Split(s, "\n")
	for i, line := range lines {
		lines[i] = strings.TrimSpace(whitespaceRe.ReplaceAllString(line, " "))
	}
	s = strings.Join(lines, "\n")
	s = blankLinesRe.ReplaceAllString(s, "\n\n")

	return strings.TrimSpace(s)
}
