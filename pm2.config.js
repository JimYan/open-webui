module.exports = {
	apps: [
		{
			name: 'litellm',
			cwd: __dirname + '/litellm',
			script: 'litellm.pm2.start.sh',
			interpreter: 'bash'
		},
		{
			name: 'openWebUI',
			cwd: __dirname + '/backend',
			script: 'openWebUI.pm2.start.sh',
			interpreter: 'bash'
		}
	]
};
