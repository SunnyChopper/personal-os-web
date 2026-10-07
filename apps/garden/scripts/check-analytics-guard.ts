import { assertGardenEventParamsSafe } from '../lib/analytics';

if (!assertGardenEventParamsSafe({ cta_id: 'nav_home' })) {
  throw new Error('expected safe garden analytics params to pass');
}

if (assertGardenEventParamsSafe({ email: 'user@example.com' })) {
  throw new Error('expected email in garden analytics params to fail guard');
}

console.log('garden analytics guard: ok');
