# GitHub Markdown TOC Sidebar

[English](README.md) | [中文](README-zh.md)

A Chrome extension that adds a floating table of contents sidebar to GitHub Markdown pages, making it easier to navigate long documentation.

![Demo](https://github.com/user-attachments/assets/572b0377-861a-498a-b5fc-e2f1498ce490)


## Features

- **Automatic TOC Generation**: Automatically extracts headers (H1-H4) from any GitHub Markdown page and generates a table of contents
- **Smart Positioning**: Automatically positions itself next to the Markdown content, avoiding CSS overflow clipping issues
- **Scroll Tracking**: Highlights the currently visible section as you scroll through the document
- **Responsive Design**: Adapts to available space with three modes:
  - Full sidebar (≥260px width)
  - Compact mode (160-259px width)
  - Mini FAB mode (<160px width) - opens a modal when clicked
- **Customizable**: Configure sidebar position (left/right) and maximum header level to display (H1-H4)
- **SPA Support**: Works with GitHub's Turbo navigation for seamless browsing

## Installation

### From Chrome Web Store (Coming Soon)

1. Visit the [Chrome Web Store page]()
2. Click "Add to Chrome"
3. Grant the necessary permissions

### Manual Installation (Developer Mode)

1. Download or clone this repository:
   ```bash
   git clone https://github.com/your-username/github-markdown-toc-sidebar.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" in the top right corner

4. Click "Load unpacked" and select the repository folder

5. The extension icon should appear in your Chrome toolbar

## Usage

1. Navigate to any GitHub repository's Markdown file (README, wiki, etc.)
2. The TOC sidebar will automatically appear on the right side of the content
3. Click any header in the TOC to jump to that section
4. Use the header buttons to:
   - Toggle sidebar position (left/right)
   - Collapse/expand the sidebar
5. In mini FAB mode (narrow view), click the button to open a modal with the full TOC

## Configuration

Click the extension icon in the Chrome toolbar to open the options page:

- **Sidebar Position**: Choose left or right side of the content
- **Heading Levels**: Select which header levels to include in the TOC (H1-H4)

Your settings are automatically saved and synced across devices if you're signed into Chrome.

## Browser Compatibility

- Chrome 88+ (Manifest V3)
- Edge 88+ (Chromium-based)
- Other Chromium-based browsers supporting Manifest V3

## Development

This extension has no build step. To make changes:

1. Edit the source files directly
2. Refresh the extension at `chrome://extensions/`
3. Reload any GitHub pages to see the changes

### File Overview

- `manifest.json` - Extension configuration and permissions
- `content.js` - Main logic for TOC extraction and sidebar rendering
- `content.css` - Sidebar styling and responsive behavior
- `options.html/js/css` - Extension settings page
- `icons/` - Extension icons in various sizes

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the need for better navigation on GitHub's long-form documentation
- Icons use GitHub's Primer design system
- Thanks to all contributors and users of this extension

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=terranc/github-markdown-toc-sidebar&type=Date)](https://star-history.com/#terranc/github-markdown-toc-sidebar&Date)
