.PHONY: all resume portfolio clean install help

# ── Targets ──────────────────────────────────────────────────────────────────

all: install resume portfolio   ## Install deps and build all PDFs

install:                        ## Install Node.js dependencies
	@echo "→ Installing dependencies..."
	@npm install --silent
	@echo "✓ Ready"

resume: node_modules            ## Build resume.pdf from resume.md
	@node scripts/build-pdf.js resume.md

portfolio: node_modules         ## Build portfolio.pdf from portfolio.md
	@[ -f portfolio.md ] && node scripts/build-pdf.js portfolio.md \
	  || echo "⚠ portfolio.md not found — skipping."

# Build any markdown file:  make pdf SRC=myfile.md [OUT=path/to/output.pdf]
pdf: node_modules               ## Build a specific file: make pdf SRC=file.md
	@[ -n "$(SRC)" ] || (echo "Usage: make pdf SRC=<file.md> [OUT=<output.pdf>]"; exit 1)
	@node scripts/build-pdf.js $(SRC) $(if $(OUT),--output $(OUT),)

clean:                          ## Remove generated PDFs in dist/
	@rm -rf dist/
	@echo "✓ Cleaned"

# ── Internals ────────────────────────────────────────────────────────────────

node_modules:
	@npm install --silent

help:                           ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'
