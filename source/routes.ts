import * as express from 'express';

export class Router {

	public router: express.Router;

	constructor () {
		this.router = express.Router();
		this.routes();
	}

	private routes(): void {
		this.router.post('/slack/events', (req, res, next) => {
			if (req.body) {
				console.log(req.body);
				let ch = req.body.challenge;
				res.type('text/plain');
				res.send(ch);
			}
		});
	}

}
