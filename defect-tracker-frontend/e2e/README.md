# Browser tests

`smoke.spec.ts` takes one case through all five stages in a real browser, with
each role doing its own stage, then opens every other page once. Any failed API
call or JavaScript error fails the test.

They need the whole app running against a **throwaway** database.

1. Reset the database and start the backend (from `defect-tracker-backend`):

   ```bash
   export DATABASE_URI=postgresql+psycopg2://USER:PASSWORD@localhost:5432/centa_e2e
   export JWT_SECRET_KEY=any-long-random-string-for-local-use
   export JWT_COOKIE_SECURE=False JWT_COOKIE_SAMESITE=Lax
   export FRONTEND_URL=http://localhost:3000
   export E2E_PASSWORD=choose-a-password
   python scripts/seed_e2e.py   # drops and recreates every table; refuses unless the name ends in _e2e or _test
   python app.py
   ```

2. Start the frontend (from `defect-tracker-frontend`):

   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:5000 npm run dev
   ```

3. Run the tests with the same password:

   ```bash
   E2E_PASSWORD=choose-a-password npm run e2e
   ```

Reset the database (step 1) before each run: the test expects to start with no cases.
