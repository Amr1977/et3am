from playwright.sync_api import sync_playwright
import time


def test_map_popup():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to donations page
        page.goto("https://foodshare777.web.app/donations")
        page.wait_for_load_state("networkidle")
        time.sleep(2)

        # Take screenshot to see current state
        page.screenshot(path="/tmp/donations-map.png", full_page=True)

        # Find markers on the map
        markers = page.locator(".leaflet-marker-icon").all()
        print(f"Found {len(markers)} markers")

        if markers:
            # Click on first marker
            markers[0].click()
            time.sleep(1)

            # Check if popup opened
            popup = page.locator(".leaflet-popup")
            popup_visible = popup.is_visible()
            print(f"Popup visible after first click: {popup_visible}")

            # Take screenshot after first click
            page.screenshot(path="/tmp/after-first-click.png", full_page=True)

            # Try clicking on another marker
            if len(markers) > 1:
                markers[1].click()
                time.sleep(1)

                popup_visible2 = popup.is_visible()
                print(f"Popup visible after second click: {popup_visible2}")

                page.screenshot(path="/tmp/after-second-click.png", full_page=True)

        # Test fullscreen on first interaction
        # Click on map container (not on marker)
        map_container = page.locator(".map-container-wrapper")
        if map_container.count() > 0:
            print(f"Map container found, checking fullscreen class...")

        browser.close()
        print("Test completed")


if __name__ == "__main__":
    test_map_popup()
