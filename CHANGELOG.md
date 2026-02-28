# Changelog

All notable changes to this project will be documented in this file.

## [1.3.6] - 2026-03-01

### Fixed
- Fix sidebar not displaying on .md file viewer pages
- Differentiate container selection between repo home pages and .md file pages
- Use markdown-body directly as container for .md file pages
- Use markdown-body's parent as container for repo home pages

## [1.3.5] - 2026-02-28

### Fixed
- Position sidebar relative to parent container instead of markdown-body element
- Fix sidebar overlap issue with markdown content on GitHub pages
- Remove dependency on unstable `.Layout` and `.Layout-main` CSS classes
- Calculate sidebar position based on markdown-body's parent container edges for consistent positioning

## [1.3.4] - 2026-02-22

### Fixed
- Add 2px tolerance for scroll header activation

## [1.3.3] - 2026-02-15

### Fixed
- Refined sticky offset calculation logic for improved heading positioning accuracy

## [1.3.2] - 2026-02-14

### Fixed
- Adjusted scroll offset from -80px to -65px for better visibility of headings under GitHub's sticky header when clicking TOC items.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.1] - 2026-02-14

### Changed
- Adjusted styles and logic for the GitHub Markdown TOC sidebar
- Enhanced options page UI with improved layout and styling
- Updated existing icons and added a new 64x64 icon for better platform compatibility

### Documentation
- Updated README with Chrome Web Store link

## [1.3.0] - 2026-02-11

### Added
- Japanese (ja) language support
- Russian (ru) language support

## [1.2.1] - 2026-02-11

### Fixed
- Fixed `mountHost` null check in `positionSidebar` function to prevent sidebar positioning failures on certain page layouts

## [1.2.0] - 2026-02-11

### Added
- URL-based page filtering to only show sidebar on relevant GitHub pages
- Responsive tier skip logic for better UI adaptation
- Enhanced internationalization support
- Chinese language support (zh_CN)

### Changed
- Updated documentation to recommend ZIP installation to avoid CRX security warnings
- Updated READMEs with GitHub Release installation instructions
- Improved icon quality and consistency

### Fixed
- Various UI/UX improvements based on user feedback

## [1.0.0] - 2026-02-10

### Added
- Initial release of GitHub Markdown TOC Sidebar
- Floating table of contents sidebar for GitHub Markdown pages
- Responsive design with three display modes (full, compact, mini FAB)
- Customizable position (left/right), collapse state, and maximum heading level
- Smooth scrolling and active section highlighting
- Support for GitHub's dark/light themes
- Internationalization support (English and Chinese)
- Extension options page for user preferences
