# Gamarr

Gamarr is a self-hosted web application for managing PC game downloads and organizing them in your game library. Similar to Sonarr/Radarr but specifically designed for PC games, Gamarr helps you monitor downloads, process game files, and maintain an organized game library.

## Features

- **Game Search**: Search and download PC games using configured indexers (via Prowlarr).
- **Post-Processing**: Automatic handling of downloaded files, including RAR extraction and ISO mounting.
- **Version Tracking**: Manage multiple versions of games and track updates or patches.
- **Game Metadata**: Fetch game details (e.g., cover art, release year, genres) from IGDB.
- **Modern Web Interface**: Clean, mobile-friendly UI with a dark theme.
- **Library Organization**: Organize games into customizable root folders.
- **Task Monitoring**: Track the status of downloads, extractions, and file movements.
- **Multi-Platform Support**: Easily deployable via Docker.

## Prerequisites

- **Docker** and **Docker Compose**
- **Prowlarr** (for indexer integration)
- **IGDB API credentials** (for metadata fetching)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/gamarr.git
   cd gamarr
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your IGDB credentials and other configuration options.

3. Build and start the Docker container:
   ```bash
   docker-compose up -d
   ```

4. Access the web interface at `http://localhost:3000`.

## Configuration

### Root Folders
1. Navigate to **Settings > Root Folders**.
2. Add directories where your games will be stored.
3. Set a default root folder for new downloads.

### IGDB Integration
1. Obtain IGDB API credentials from [IGDB](https://api.igdb.com).
2. Add your credentials in **Settings > General**.

### Prowlarr Integration
1. Configure Prowlarr connection details in **Settings > Indexers**.
2. Ensure Prowlarr is set up to search for PC games.

## Project Structure

```
.
├── data/                     # Persistent data (e.g., SQLite database)
├── docker-compose.yml.example # Example Docker Compose configuration
├── docker-entrypoint.sh      # Docker entrypoint script
├── Dockerfile                # Docker build configuration
├── ecosystem.config.js       # PM2 process manager configuration
├── frontend/                 # Frontend source code
│   ├── public/               # Static assets (e.g., icons, manifest)
│   ├── src/                  # Next.js application
│   │   ├── app/              # Pages and components
│   │   │   ├── activity/     # Activity tracking page
│   │   │   ├── components/   # Reusable React components
│   │   │   ├── library/      # Library pages
│   │   │   ├── settings/     # Settings pages
│   │   │   └── search/       # Search functionality
│   │   ├── globals.css       # Global styles
│   │   ├── layout.js         # Root layout
│   │   └── tailwind.config.js # Tailwind CSS configuration
│   ├── package.json          # Frontend dependencies
│   └── README.md             # Frontend-specific documentation
├── src/                      # Backend source code
│   ├── app.js                # Express application entry point
│   ├── config/               # Configuration files
│   ├── db.js                 # SQLite database initialization
│   ├── routes/               # API routes
│   │   ├── games.js          # Game-related API endpoints
│   │   └── settings.js       # Settings-related API endpoints
│   ├── services/             # Core business logic
│   │   ├── downloader.js     # Download client integration
│   │   ├── extraction.js     # File extraction logic
│   │   ├── fileManager.js    # File management utilities
│   │   ├── indexer.js        # Indexer integration (e.g., Prowlarr)
│   │   ├── metadata.js       # Game metadata fetching (IGDB)
│   │   ├── taskService.js    # Task management
│   │   └── uiFileManager.js  # File-related UI logic (e.g., NFO parsing)
│   ├── tasks/                # Task processing logic
│   │   ├── monitor.js        # File monitoring
│   │   ├── processDownload.js # Download processing
│   │   └── queue.js          # Task queue management
│   └── utils/                # Utility functions
│       ├── helpers.js        # Helper functions
│       ├── progress.js       # Progress tracking utilities
│       └── validateJson.js   # JSON validation utilities
├── package.json              # Backend dependencies
└── README.md                 # Project documentation
```

## Development

### Building for Development

```bash
# Build the Docker container
docker-compose build

# Start the container
docker-compose up -d
```

### Debugging

- **Backend logs**: `docker-compose logs -f app`
- **Frontend logs**: Available in the browser console
- **Database**: SQLite database located in `/data/gamarr.db`

### Testing API Endpoints
Use tools like Postman or cURL to test the backend API endpoints. For example:

```bash
curl http://localhost:3000/api/games
```

## Features in Development

- [ ] Indexer integration (Prowlarr)
- [ ] Download client integration (e.g., qBittorrent, NZBGet)
- [ ] Multiple version management for games
- [ ] Game update notifications
- [ ] Backup/restore functionality
- [ ] User authentication
- [ ] API documentation

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push to the branch.
5. Create a Pull Request.

## License

[MIT License](LICENSE)

## Acknowledgments

- Inspired by Sonarr/Radarr.
- Uses IGDB for game metadata.
- Built with Next.js and Express.

## Support

For support, please:
1. Check the [Issues](https://github.com/yourusername/gamarr/issues) page.
2. Create a new issue if your problem isn't already listed.
3. Provide detailed information about your setup and the issue.