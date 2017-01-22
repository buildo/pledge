import 'babel-core/register';
import 'babel-polyfill';
import app from './app';
import * as db from './db';

app.listen(3000, db.init);
