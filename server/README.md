# Cockpit NodeJS Server
This documenation is complimentary to the Cockpit Web Dashboard documentation.  The combination of both WebAPP and Server provide a complete experience where 
your servers resources and websites are easily exposed to your developers (and thus don't require SSH/admin access).

## Resources
1. Currently using this for tagging references: [Tutorial](https://www.akshatsharma.com/posts/how%20to%20jsdoc/index.html)
2. Another good resource for Markdown is: [Markdown Cheatsheet](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
3. All HTTP Status Codes are conformant to source documentatin: [HTTP Status Codes](https://www.restapitutorial.com/httpstatuscodes.html)
4. JSDoc cheatsheet [JSDoc Cheetsheat](https://devhints.io/jsdoc)

## Development Environment
1.  There is a /www project.  `npm start` will kick off the dev server.
2.  There is a /server project.  I typical run this within the IDE so I can easily debug.  
3.  There is a documentation built in using jsdoc (I believe).  TODO:  Forgot out to run this, but it's in the /server project and can be found in /server/out/ for now.  This needs to be built to run consistently.