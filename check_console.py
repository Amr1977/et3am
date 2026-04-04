from playwright.sync_api import sync_playwright
import sys

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    console_messages = []
    errors = []

    def on_console(msg):
        console_messages.append(f"[{msg.type}] {msg.text}")
        if msg.type == "error":
            errors.append(msg.text)

    page.on("console", on_console)
    page.on("pageerror", lambda err: errors.append(f"Page error: {err}"))

    try:
        page.goto("http://localhost:5174/", timeout=30000)
        page.wait_for_timeout(5000)

        print("=== Console Messages ===")
        for msg in console_messages[:50]:
            print(msg)

        print("\n=== Errors ===")
        if errors:
            for err in errors:
                print(err)
        else:
            print("No errors found!")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()
