from playwright.sync_api import sync_playwright


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        console_messages = []
        page.on(
            "console", lambda msg: console_messages.append(f"[{msg.type}] {msg.text}")
        )
        page.on("pageerror", lambda err: console_messages.append(f"[pageerror] {err}"))

        try:
            page.goto("https://et3am26.web.app", timeout=60000)

            # Wait for React to render
            page.wait_for_selector("#root", timeout=10000)

            # Wait more for stats to load
            page.wait_for_timeout(8000)

            # Check if stats section exists in DOM
            stats_exists = page.locator(
                ".stats-section, .stats-grid, .stat-number"
            ).count()
            print(f"Stats elements found: {stats_exists}")

            # Get any stats text
            try:
                stats_text = page.locator(".stats-section").inner_text()
                print(
                    f"Stats section text: {stats_text[:200] if len(stats_text) > 200 else stats_text}"
                )
            except:
                print("Stats section: NOT FOUND")

            # Get hero section content
            try:
                hero_text = page.locator(".hero").inner_text()
                print(f"Hero text length: {len(hero_text)}")
            except:
                print("Hero section: NOT FOUND")

            # Save console messages
            with open("console_output.txt", "w", encoding="utf-8") as f:
                f.write("\n".join(console_messages))
            print(f"\nConsole messages: {len(console_messages)}")
            for msg in console_messages:
                if "error" in msg.lower() or "stats" in msg.lower():
                    print(f"  {msg}")

        except Exception as e:
            print(f"Error: {e}")
            with open("error_log.txt", "w") as f:
                f.write(str(e))

        browser.close()


if __name__ == "__main__":
    main()
