---
description: Push to GitHub
---

# How to Push to GitHub

Since I cannot access your GitHub account directly, you'll need to create the repository and push the code.

1.  **Create a New Repository on GitHub**
    *   Go to [github.com/new](https://github.com/new).
    *   Name it `chromewright-no-12` (or whatever you prefer).
    *   **Do not** initialize with README, .gitignore, or License (we already have them).
    *   Click **Create repository**.

2.  **Push the Code**
    *   Copy the commands from the "…or push an existing repository from the command line" section.
    *   They will look like this (replace `YOUR_USERNAME` with your actual username):

    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/chromewright-no-12.git
    git branch -M main
    git push -u origin main
    ```

3.  **Run the Commands**
    *   Paste those commands into your terminal here.
