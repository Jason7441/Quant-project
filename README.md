# Quant Analysis Dashboard

A comprehensive market analysis tool that scans stocks and commodities using technical indicators to provide buy/sell recommendations, presented in a sleek, modern web interface.

## Features

- **Real-time Analysis:** Fetches and analyzes market data on demand.
- **Modern UI:** A clean, minimalist, monochrome interface built with React.
- **Dynamic & Interactive:** Instantly analyze any stock ticker using the search bar.
- **Full-Stack Application:** Powered by a Python/FastAPI backend and a React frontend.
- **Covers Stocks & Commodities:** Analyzes a predefined list of popular stocks and commodities on load.

## Technology Stack

- **Backend:** Python 3, FastAPI
- **Frontend:** React, TypeScript, CSS Modules
- **Data Source:** `yfinance` for market data, Finviz for news headlines.

## Getting Started

These instructions will get the entire full-stack application running on your local machine.

### Prerequisites

- **Python 3.7+**
- **Node.js and npm** (LTS version recommended)

### Installation & Launch

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Jason7441/Quant-project.git
    cd Quant-project
    ```

2.  **Run the appropriate script for your OS:**

    -   **On macOS/Linux:**
        First, make the script executable (you only need to do this once):
        ```bash
        chmod +x run-app.command
        ```
        Then run it:
        ```bash
        ./run-app.command
        ```

    -   **On Windows:**
        Simply double-click the `run-app.bat` file, or run it from your command prompt:
        ```cmd
        run-app.bat
        ```

This script will automatically:
- Install all Python and Node.js dependencies.
- Start the backend API server.
- Launch the frontend React application.

Your web browser should open to `http://localhost:3000` with the application running.

### To Stop the Application
-   **On macOS/Linux:** Press `Ctrl+C` in the terminal. The script will shut down both servers.
-   **On Windows:** Close the main command prompt window (the one running the React app). You will also need to manually close the second "Backend" window that opened.

## Disclaimer

This tool is for informational purposes only and does not constitute financial advice. The stock market is volatile, and you should always do your own research before making any investment decisions.