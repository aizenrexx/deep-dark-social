# REA teardown — facebook.com (for Deep Dark Social FB-clone round)

Tool: REA (rea-agents) 6.8.0 on the LA VPS, CDP headless Chrome port 9333.
Evidence saved on VPS: /home/iris/dds-fb-clone/rea-evidence/

## What REA covered
- `rea inspect-web-page` SUCCEEDED for:
  - https://www.facebook.com/ — evidence ev_a9c4b2fe…, 130 KB. Logged-out view = login wall:
    "Log into Facebook", Email or phone number field, Password field, "Log In" button,
    "Forgot password?", "Create new account", "Facebook Lite" link.
  - https://www.facebook.com/facebook — evidence 276 KB. Same login modal over the page
    ("Log in to Facebook", "See more from Facebook", Close button on the modal).
- Endpoint lesson: REA requires http://127.0.0.1:9333 (literal IP), "localhost" is rejected.

## What REA did NOT cover (honest record)
- The logged-in Facebook app (feed/profile/groups UI) cannot be captured: this headless
  profile has no Facebook login, and Facebook walls everything behind the login modal.
  Feed/profile/group geometry therefore comes from the Wonder blueprint (model knowledge
  of the current FB web UI) + the same CSS values already used in our v1 FB-style pass,
  verified afterwards against screenshots of OUR site.
