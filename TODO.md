# TODO - Tasks and Bugs to Process

## Rules
- Process tasks sequentially unless critical
- Don't interrupt current task unless given critical task
- Read TODO.md, append to TASKLIST.md, keep TASKLIST.md updated
- When task is done, mark complete in TASKLIST.md
- Periodically Read TODO.md, append new tasks to TASKLIST.md
- Commit periodically
- Apply design polish for each task
- apply localization support for each task
- apply full test coverage support for each task
- apply localization support for each task
- apply full dcoumentation for each task
- commit and push and deploy frequently for simpler rollback in case of file corruption/errors
- with each deploy make sure KB is updated and pushed
- when you start working on a task move its ticket to in progress lane in trello, when finished move it to done lane
- prioritize tasks in trello backlog lane order so that top priority are at the top of the lane and give them priority labels/tags
- categorize trello tickets by labels/tags 
- after finishing a task: commit and push and deploy FE BE and FE and update KB local and remote
- TO avoid sharing violation on TODO.md file: use it as read only untiil I tell you to check it and update its
- When synchronzig and accessing trello board: make sure each ticket has an ID, edit ticket titles if needed to add its ID



---

## Tasks
- [ ] Clone matrix-delivery and other projects to this VPS for unified AI CLI experience


---

## BUGS

- [x] No "Report" button found on donation card
- [x] Chat crash
- [x] home page stats show incorrect numbers
- [x] Admin panel users tab crashing
- [x] donation page address doesnt provide edit action button
- [x] own donation card: some do not show edit button.
- [x] hash codes are not shown anywhere, each meal receiver/donor should be given a hashcode for each meal to preserve privacy and ensure correct pickup.
- [x] Availability time (start, end) is critical to show, currently missing in meal/donation page and grid
- [x] Owner unable to edit his donation
- [x] meal page: no data/time shown
- [x] donations grid: no start/end time shown
- [x] donation time entried should be in user time zone, currently they are UTC
- [x] donation description formatting dropped, allow same user formatting, do not drop user formatting
- [x] donations description text direction disordered when mixing arabic/english numbers and arabic text
- [x] donation page address shows "Address not available"
- [x] number of total users in home page stats not equal to number of users in admin panel
- [x] Donations page: map: mouse pointer flikering and op clicking a marker no action occures
- [x] Donations page: map: on interacting with map and after it expands found that it doesnt expand to cover all the view port, it should expand even over the footer and navigation bar
- [x] Home page: interacting with map: expected map to auto expand to be full screen, found: no map expand occured
- [x] user avatar is still existing in navbar, we need to completely remove it, accessing uer profile should be in side menu
- [x] CORS errors when FE tries to failover on GCP server
- [x] Home page: map not showing donations
- [x] Home page: map not full screen on firt user interaction
- [x] Home page: maps says 0 donations which is invalid number
- [x] Home page: stats show wrong users number
- [x] Home page: Hero map: should be centered on current user location (should ask for location permission if not granted yet)
- [x] Home page: Hero map: should show animated marker for current user location
- [x] donations page: grid view: sort donations by distance in backend, closest donations should come first in the list
- [x] a user with time zone UTC + 2 creates a donation starting from 08:00, expected that receiver find donation with start time 08:00, found that receiver sees donation start time is 10:00