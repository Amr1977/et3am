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
- [x] rename side menu dashboard to be Admin Panel
- [x] remove brand image in navbar and redesign brand text and version string
- [x] generate full task history in TASKLIST.md so that i can test what we did get all previous tasks from git log
- [x] Admin Panel: admin should be able to manage users, meal posts, reservations, flags
- [x] implement full reputaion system with mutual review as we did in matrix delivery project with better design.
- [x] allow donor to CRUD own donation
- [x] when a new user is registered, admins get notified with a link to user profile
- [x] admin gets notified when meal donation is added/picked up/completed 
- [x] add push notifications
- [ ] Stats in home page are updated realtime with simple tick/ding sound and animation on change
- [ ] maps are life: if a meal is added or reserved in the visible part it is animated ( added/removed ) with sound effect
- [ ] donations grid is life, all changes reflect realtime
- [x] hamburger menu is not added for desktop browser (tested on firefox/desktop display resolution 1440x900) and menu items are scattered on top of navbar and below it
- [x] home page: remove "Food Donors" part of stats as it is duplicate.
- [ ] on interacting with any map it should be expanded to take full screen with a simple close button in upper right corner so that user feels releafed with large map interaction. (Donations page done, home page pending)
- [P] Apply docs/et3am_comprehensive_review.html
- [P] Re-Design Admin panel Donations tab
- [P] Admin Panel: Design: use secondary side menu or use two level item in main side menu for admin panel and its tab (allow items/sub-items)
- [x] Add confirmation dialog on users actions (reserve donation, delete donations, save edited donation, mark donation as completed, etc) 
- [x] Add submitting clients/frontend logs to backend, support rotation, auto detect crashes/errors and create crash report for each crash pattern, make a table in database for crashes, each crash entry should contain full context/session/request information in order to be able to reproduce and fix the bug, send admin notification with the crash entry id and add a tab in admin panel to view crash entries and download all/selected crash entries, tag it as frontend crash for filtering
- [x] Handle backend crashes same as client crashes (store in database and notify admin and include in admin panel tab, etc) and tag it as backend crash for filtering
- [x] meal baloon on map: tapping it should navigate user to meal page 
- [ ] meal baloon: own meal actions should be cancel, delivered, no reserve action button should show, and address and time should show up to signed in users
- [ ] My reservations page: on user cancelling a reservation do not navigate to donation page.
- [ ] My donations page: should have grid view and map view with this donor specific donations (available/reserved)
- [ ] create and use placeholder mp3 files for events, i will overwrite later with proper mp3 files
- [ ] Home page: hero map: on click/tap: show full baloon same design as in donations page map , currently it shows minimal baloon
- [ ] As a donor I should be able to pause a donation so that it is temporarily not listed publicly, if reserved then cancel reservation.
- [ ] As a user when i reserve a donation i should see a unique 5 digit hashcode in order fields, this code will be used to pickup that donation
- [ ] As a donor when another user reserves my donation then I should see a unique 5 digit hashcode in donation fields so that I only deliver this donation to that hashcode holder.



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
- [ ] donation time entried should be in user time zone, currently they are UTC
- [ ] donation description formatting dropped, allow same user formatting, do not drop user formatting
- [ ] donations description text direction disordered when mixing arabic/english numbers and arabic text
- [ ] donation page address shows "Address not available"
- [ ] number of total users in home page stats not equal to number of users in admin panel
- [ ] Donations page: map: mouse pointer flikering and op clicking a marker no action occures
- [ ] Donations page: map: on interacting with map and after it expands found that it doesnt expand to cover all the view port, it should expand even over the footer and navigation bar
- [ ] Home page: interacting with map: expected map to auto expand to be full screen, found: no map expand occured
- [ ] user avatar is still existing in navbar, we need to completely remove it, accessing uer profile should be in side menu
- [ ] CORS errors when FE tries to failover on GCP server
- [P] Home page: map not showing donations
- [P] Home page: map not full screen on firt user interaction
- [P] Home page: maps says 0 donations which is invalid number
- [P] Home page: stats show wrong users number
- [ ] Home page: Hero map: should be centered on current user location (should ask for location permission if not granted yet)
- [ ] Home page: Hero map: should show animated marker for current user location
- [ ] donations page: grid view: sort donations by distance in backend, closest donations should come first in the list
- [ ] a user with time zone UTC + 2 creates a donation starting from 08:00, expected that receiver find donation with start time 08:00, found that receiver sees donation start time is 10:00