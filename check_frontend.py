from playwright.sync_api import sync_playwright
import os

screenshot_path = os.path.abspath("screenshot.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    console_errors = []
    page.on(
        "console",
        lambda msg: console_errors.append(f"{msg.type}: {msg.text}")
        if msg.type == "error"
        else None,
    )

    try:
        page.goto("http://localhost:5174/", timeout=10000)
        page.wait_for_timeout(3000)
    except Exception as e:
        print(f"Navigation error: {e}")

    page.screenshot(path=screenshot_path, full_page=True)
    browser.close()

    print(f"Screenshot saved to: {screenshot_path}")
    if console_errors:
        print("\nConsole Errors:")
        for err in console_errors:
            print(f"  - {err}")
    else:
        print("\nNo console errors detected.")
