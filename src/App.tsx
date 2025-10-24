/* eslint-disable */

import { useEffect, useState } from "react";
import "./App.css";

interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
}

interface DownloadProgress {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

function App() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>("");
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const ipc = window.ipcRenderer;

    if (!ipc) return;

    // Define handlers
    const handleUpdateStatus = (_event: any, status: string) => {
      setUpdateStatus(status);
      setIsChecking(status === "checking");
    };

    const handleUpdateAvailable = (_event: any, info: UpdateInfo) => {
      setUpdateInfo(info);
      setIsChecking(false);
    };

    const handleUpdateNotAvailable = () => {
      setIsChecking(false);
      setUpdateStatus("up-to-date");
      setTimeout(() => setUpdateStatus(""), 3000);
    };

    const handleDownloadProgress = (
      _event: any,
      progress: DownloadProgress
    ) => {
      setDownloadProgress(progress.percent);
    };

    const handleUpdateDownloaded = (_event: any, info: UpdateInfo) => {
      setIsDownloading(false);
      setUpdateDownloaded(true);
      console.log("Update downloaded:", info);
    };

    const handleUpdateError = (_event: any, error: Error) => {
      console.error("Update error:", error);
      setIsDownloading(false);
      setIsChecking(false);
      setUpdateStatus("error");
      setTimeout(() => setUpdateStatus(""), 3000);
    };

    // Listen for updates
    ipc.on("update-status", handleUpdateStatus);
    ipc.on("update-available", handleUpdateAvailable);
    ipc.on("update-not-available", handleUpdateNotAvailable);
    ipc.on("download-progress", handleDownloadProgress);
    ipc.on("update-downloaded", handleUpdateDownloaded);
    ipc.on("update-error", handleUpdateError);

    return () => {
      // Remove all listeners properly
      ipc.off("update-status", handleUpdateStatus);
      ipc.off("update-available", handleUpdateAvailable);
      ipc.off("update-not-available", handleUpdateNotAvailable);
      ipc.off("download-progress", handleDownloadProgress);
      ipc.off("update-downloaded", handleUpdateDownloaded);
      ipc.off("update-error", handleUpdateError);
    };
  }, []);

  const handleCheckUpdates = async () => {
    const ipc = window.ipcRenderer;
    if (!ipc) return;

    setIsChecking(true);
    try {
      await ipc.invoke("check-for-updates");
    } catch (error) {
      console.error("Error checking for updates:", error);
      setIsChecking(false);
    }
  };

  const handleDownload = async () => {
    const ipc = window.ipcRenderer;
    if (!ipc) return;

    setIsDownloading(true);
    try {
      await ipc.invoke("download-update");
    } catch (error) {
      console.error("Error downloading update:", error);
      setIsDownloading(false);
    }
  };

  const handleInstall = () => {
    const ipc = window.ipcRenderer;
    if (!ipc) return;

    ipc.invoke("install-update");
  };

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <div className="logo">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="24"
                cy="24"
                r="22"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M16 20h16M24 12v24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1>GDG - toe</h1>
          <p className="version">Version 1.1.1 -by BHUVNESH VERMA</p>
        </div>

        <div className="content">
          <p className="description">
            Your awesome Electron app with auto-updates
          </p>

          {/* Update notifications */}
          {updateDownloaded && (
            <div className="update-card success">
              <div className="update-icon">✓</div>
              <div className="update-content">
                <h3>Update Ready!</h3>
                <p>
                  Version {updateInfo?.version} has been downloaded and is ready
                  to install.
                </p>
                <button
                  className="btn btn-primary"
                  onClick={handleInstall}
                >
                  Restart & Install
                </button>
              </div>
            </div>
          )}

          {updateInfo && !updateDownloaded && (
            <div className="update-card info">
              <div className="update-icon">↓</div>
              <div className="update-content">
                <h3>Update Available!</h3>
                <p>Version {updateInfo.version} is now available.</p>
                {isDownloading ? (
                  <div className="download-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${downloadProgress}%` }}
                      />
                    </div>
                    <p className="progress-text">
                      Downloading... {downloadProgress.toFixed(1)}%
                    </p>
                  </div>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={handleDownload}
                  >
                    Download Update
                  </button>
                )}
              </div>
            </div>
          )}

          {updateStatus === "up-to-date" && (
            <div className="status-message success">
              ✓ You're running the latest version
            </div>
          )}

          {updateStatus === "error" && (
            <div className="status-message error">
              ✗ Error checking for updates
            </div>
          )}

          {!updateInfo && !updateDownloaded && (
            <button
              className="btn btn-secondary"
              onClick={handleCheckUpdates}
              disabled={isChecking}
            >
              {isChecking ? (
                <>
                  <span className="spinner" />
                  Checking for Updates...
                </>
              ) : (
                "Check for Updates"
              )}
            </button>
          )}
        </div>

        <footer className="footer">
          <p>
            Built with ❤️ by{" "}
            <a
              href="https://github.com/MasterBhuvnesh"
              target="_blank"
              rel="noopener noreferrer"
            >
              MasterBhuvnesh
            </a>
          </p>
          <p>
            <a
              href="https://toe.gdgrbu.tech"
              target="_blank"
              rel="noopener noreferrer"
            >
              toe.gdgrbu.tech
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
