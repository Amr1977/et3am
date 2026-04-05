from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    # Navigate to the login page
    page.goto("https://et3am.com/login")
    page.wait_for_load_state("networkidle")

    print("Browser opened at login page.")
    print("Please complete the login manually.")
    print("Waiting for login to complete (checking every 5 seconds)...")

    # Wait for login to complete (URL changes or token appears)
    max_wait = 120  # 2 minutes
    start_time = time.time()
    logged_in = False

    while time.time() - start_time < max_wait:
        # Check if token exists in localStorage
        token = page.evaluate("localStorage.getItem('token')")
        if token:
            print(f"Login successful! Token: {token[:50]}...")
            logged_in = True
            break

        # Check if URL changed (user logged in)
        if "login" not in page.url.lower():
            print(f"URL changed to: {page.url}")
            token = page.evaluate("localStorage.getItem('token')")
            if token:
                print(f"Token found: {token[:50]}...")
                logged_in = True
                break

        time.sleep(5)
        print("Still waiting...")

    if not logged_in:
        print("Login not completed within 2 minutes. Current URL:", page.url)

    print("Closing browser in 10 seconds...")
    time.sleep(10)
    browser.close()
