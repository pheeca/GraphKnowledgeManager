# User Manual

The software - knowledge graph represents a collection of interlinked descriptions and properties of entities – objects, events or concepts. Knowledge graph put data in context via linking and semantic metadata and this way provide a framework for data integration, unification, analytics and sharing. Simply put, software depicts ***knowledge*** in terms of entities and their relationships and facilitate self organization.


# About

Name: Knowledge Graph

Version: v 1.0.0

Intended Use: Define entities and their relationships

Access : https://graphknowledge.pheeca.com

Features: 

Getting Help: To receive technical support and software assistance, please contact 	support@pheeca.com

# Versions
Version: 1.0.0	

Commit hash:	828bde1c753e6d6469f499dd020a03e4201b0098

Date: 2/5/2021 2:37:21 AM

# Getting Started


## Navigating to Site

Open website https://graphknowledge.pheeca.com in browser (Chrome, Firefox) on PC Desktop/Laptop (Not available on other devices right now)
<img src="Img/MainPage.PNG" width="100%" />


## Create a new user
If you do not already have a user, you can create it. 

1. Add Username
2. Add Password
3. Click **User Create**

<img src="Img/MainPage_UserCreate.PNG" width="100%" />

## Login/Logout

In order to login,

1. Add Username
2. Add Password
3. Click **Login**
4. Select graph

<img src="Img/MainPage_Login.PNG" width="100%" />

Once logged in, you can click **Logout** to signout


<img src="Img/MainPage_Logout.PNG" width="100%" />

## Create a new graph/Open existing Graph
In order to open graph(after login),

1. Add Username
2. Add Password
3. Click **Login**
4. Select graph

<img src="Img/MainPage_Login.PNG" width="100%" />

For creating graph,

1. Add Username
2. Add Password
3. Click **Login**
4. Click **Add Graph**

<img src="Img/MainPage_CreateGraph1.PNG" width="100%" />

5. Add Graph Name
6. Click **Add**

<img src="Img/MainPage_CreateGraph2.PNG" width="100%" />

## Graph Panel

In order to zoom in and zoom out, you can click button **1** and **2** respectively. Alternatively mouse scroll button or +/- keys on keyboard can be used to zoom in/out.

Click **3** button for full-screen.

Buttons **4** to move screen right,left,top,buttom, alternatively arrow keys can be used on keyboard.

Select node (see **5** in image) by clicking on it, you can also hold it and drag. You may see selecting a node opens up a side panel.

<img src="Img/MainPage_GraphPanel.PNG" width="100%" />
Nodes can have different shapes, colors and they can connect to each other by edge.

## Nodes and edges - connecting node, create new node, edit/delete node, create new edge, edit/delete edge
## entering into Child Node and Parent Node
## Save Graph
## Undo/Redo
## Tags & Search (tagtype:tag)
## set node color
## Neighboring Model
## Nested Nodes & Global Mode
## Storing information on node/properties of node
## Move node/Change parent
## Join nodes as same under different context, redirect
## Graph Sharing

# Developer Manual
## System Requirement
## Technology Stack
#### Database
![Microsoft Sql Server](https://img.shields.io/badge/-Sql%20Server-CC2927?style=flat-square&logo=microsoft-sql-server&logoColor=ffffff)
#### Server side:
![Nodejs](https://img.shields.io/badge/-Nodejs-339933?style=flat-square&logo=Node.js&logoColor=ffffff)
![C#](https://img.shields.io/badge/-C%23-239120?style=flat-square&logo=c-sharp&logoColor=ffffff)
![Dot NET SignalR](https://img.shields.io/badge/Framework-SignalR-512BD4?style=flat-square&logo=.Net&logoColor=ffffff)
![Dot NET](https://img.shields.io/badge/-MVC%2FWebApi-512BD4?style=flat-square&logo=.Net&logoColor=ffffff)

#### FrontEnd
![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1C?style=flat-square&logo=javascript&logoColor=white&color=F7DF1C)
![HTML5](https://img.shields.io/badge/-HTML5-%23E44D27?style=flat-square&logo=html5&logoColor=ffffff)
![CSS3](https://img.shields.io/badge/-CSS-%231572B6?style=flat-square&logo=css3)
![Bootstrap](https://img.shields.io/badge/-Bootstrap-563D7C?style=flat-square&logo=Bootstrap)
![jQuery](https://img.shields.io/badge/-jQuery-0769AD?style=flat-square&logo=jquery)

### Pre Requisites
### Repository
### Project Structure
### Data Restore (DB)
### Setting Up Dev Environment
### Server Side Dev
### Client Side Dev
### Engine Dev


#### Front End
window.EventBus.listeners
messagebushub.trigger

#### Server
MessageBus<object>.Instance.RegisterService
SampleEventService,CoreEventService
OnEvent


## Dev Problems
Database versioning

Data versioning

Global Uniform data template?

sustainable way to Support multiple OS/Devices (Mobile, Linux, MacOS, iOS, Android)

Sharing Graph wrt (Tenancy/USer/Graphs/Devices)

# Conceptual Model Analysis Manual


-DEF 1
Entities+EntityTypes+Process Declaration+Scheduler+Event Engine+Reporting/Notification Engine+Prioritization Engine+Inference/Function Engine+Information Manupulation Engine= System

-DEF 2
dynamic event placement engine+events+actions+information+process declaration+inferencing/estimating all these 



## Conceptual Problems
how Tenancy/USer/Graphs/Devices/3rd party data pipelines affect event highways?

App events(page load,click,login,request started,DB inserted) different than System Events (birthdays, comments,scheduled events etc)?
APP
   Server
		onerror
		appstart
		append
		requeststart
   UI
   ConnectedDevice (access other devices's events-but not hackable)
SystemGlobal
	Login
		user logged in attempt(user id,isSuccess)
	TimeInterval
		Minute
		Hour (timezone based)
		Day (timezone based)
		Weekday,Weekend,Week,Month,year
		NamazTimeChange (timezone based)
			Fajr
			Zuhr
			Asr
			Maghrib
			Isha
		Sun (timezone based)
			True Dawn (-18 degrees)
			Sun rise (0 degree)
			Sun Set
Contextualized (wrt graph,user,tenant)
	User
		Loggedin
		Loggedout
	Location
		changed
	Data(with filter+from-to)
	 graph created,graph saved,graph opened,node added, node modified,node deleted, property added,property modified,property deleted,undo,redo,(link node?),edge added,edge modified,edge deleted etc
	DataPipeline
		Twitter/FB (fb/whatsapp/twitter/news)
	Process (Actions)
	Bot(??? Not sure,manual + automated)
	Prioritizer
	Inference
		Logical (prolog)
		Predictive
	Notify(including absoltue start end,interval type,interval start end,interval delayed custom point)
		SMS
		email
		Mobile Notification
		Device Alarm
	DynamicEvent 
		custom (filter by graph,user,tenant,Location,Time[including from-to;including absoltue start end,interval type,interval start end,interval delayed custom point])
	Information manipulator
		  interfaced(user facilitated)
		  non interfaced(automatic)
	Reporter
		Generate Reports (tabular,visual graphs; embeded in systems internal and external systems email,mobile,etc)

concurrent user/Information Manupulation Engine manipulating info?

Graph Permission/share with user of other graph?

-------------
## Notes:

documentation

USer manual

Developer Manual

Idea manual


Product name
Model or type number
Intended use
Features/accessories
Description of the main product elements
Description of the user interface
Safety warnings
Installation instructions
Description of how to use/operate the product
Troubleshooting section and instructions on how to solve problems
Maintenance information
Repair information
Information on disposal of the product and packaging
Technical specifications
Table of content
Index
Glossary
Warranty information
Contact details

-----------------------
user manual
-About
-SysRequirement
-How to open website
-Getting Help
-Versions
--Create a new user
--Login/Logout
--Create a new graph/Open existing Graph
--Graph Panel - drag Nodes,select node/edge, scroll up/down/right/left, Zoom in-out
--Nodes and edges - connecting node, create new node, edit/delete node, create new edge,edit/delete edge
--entering into Child Node and Parent Node
--Save Graph 
--Undo/ReDo
--Tags & Search (tagtype:tag)
--set node color
--Neighbouring Model
--Nested Nodes & Global Mode
--Storing information on node/properties of node
--Move node/Change parent
--Join nodes as same under different context, redirect
--GraphShareing


https://stackedit.io/app#





















The file explorer is accessible using the button in left corner of the navigation bar. You can create a new file by clicking the **New file** button in the file explorer. You can also create folders by clicking the **New folder** button.

## Switch to another file

All your files and folders are presented as a tree in the file explorer. You can switch from one to another by clicking a file in the tree.

## Rename a file

You can rename the current file by clicking the file name in the navigation bar or by clicking the **Rename** button in the file explorer.

## Delete a file

You can delete the current file by clicking the **Remove** button in the file explorer. The file will be moved into the **Trash** folder and automatically deleted after 7 days of inactivity.

## Export a file

You can export the current file by clicking **Export to disk** in the menu. You can choose to export the file as plain Markdown, as HTML using a Handlebars template or as a PDF.


# Synchronization

Synchronization is one of the biggest features of StackEdit. It enables you to synchronize any file in your workspace with other files stored in your **Google Drive**, your **Dropbox** and your **GitHub** accounts. This allows you to keep writing on other devices, collaborate with people you share the file with, integrate easily into your workflow... The synchronization mechanism takes place every minute in the background, downloading, merging, and uploading file modifications.

There are two types of synchronization and they can complement each other:

- The workspace synchronization will sync all your files, folders and settings automatically. This will allow you to fetch your workspace on any other device.
	> To start syncing your workspace, just sign in with Google in the menu.

- The file synchronization will keep one file of the workspace synced with one or multiple files in **Google Drive**, **Dropbox** or **GitHub**.
	> Before starting to sync files, you must link an account in the **Synchronize** sub-menu.

## Open a file

You can open a file from **Google Drive**, **Dropbox** or **GitHub** by opening the **Synchronize** sub-menu and clicking **Open from**. Once opened in the workspace, any modification in the file will be automatically synced.

## Save a file

You can save any file of the workspace to **Google Drive**, **Dropbox** or **GitHub** by opening the **Synchronize** sub-menu and clicking **Save on**. Even if a file in the workspace is already synced, you can save it to another location. StackEdit can sync one file with multiple locations and accounts.

## Synchronize a file

Once your file is linked to a synchronized location, StackEdit will periodically synchronize it by downloading/uploading any modification. A merge will be performed if necessary and conflicts will be resolved.

If you just have modified your file and you want to force syncing, click the **Synchronize now** button in the navigation bar.

> **Note:** The **Synchronize now** button is disabled if you have no file to synchronize.

## Manage file synchronization

Since one file can be synced with multiple locations, you can list and manage synchronized locations by clicking **File synchronization** in the **Synchronize** sub-menu. This allows you to list and remove synchronized locations that are linked to your file.


# Publication

Publishing in StackEdit makes it simple for you to publish online your files. Once you're happy with a file, you can publish it to different hosting platforms like **Blogger**, **Dropbox**, **Gist**, **GitHub**, **Google Drive**, **WordPress** and **Zendesk**. With [Handlebars templates](http://handlebarsjs.com/), you have full control over what you export.

> Before starting to publish, you must link an account in the **Publish** sub-menu.

## Publish a File

You can publish your file by opening the **Publish** sub-menu and by clicking **Publish to**. For some locations, you can choose between the following formats:

- Markdown: publish the Markdown text on a website that can interpret it (**GitHub** for instance),
- HTML: publish the file converted to HTML via a Handlebars template (on a blog for example).

## Update a publication

After publishing, StackEdit keeps your file linked to that publication which makes it easy for you to re-publish it. Once you have modified your file and you want to update your publication, click on the **Publish now** button in the navigation bar.

> **Note:** The **Publish now** button is disabled if your file has not been published yet.

## Manage file publication

Since one file can be published to multiple locations, you can list and manage publish locations by clicking **File publication** in the **Publish** sub-menu. This allows you to list and remove publication locations that are linked to your file.


# Markdown extensions

StackEdit extends the standard Markdown syntax by adding extra **Markdown extensions**, providing you with some nice features.

> **ProTip:** You can disable any **Markdown extension** in the **File properties** dialog.


## SmartyPants

SmartyPants converts ASCII punctuation characters into "smart" typographic punctuation HTML entities. For example:

|                |ASCII                          |HTML                         |
|----------------|-------------------------------|-----------------------------|
|Single backticks|`'Isn't this fun?'`            |'Isn't this fun?'            |
|Quotes          |`"Isn't this fun?"`            |"Isn't this fun?"            |
|Dashes          |`-- is en-dash, --- is em-dash`|-- is en-dash, --- is em-dash|


## KaTeX

You can render LaTeX mathematical expressions using [KaTeX](https://khan.github.io/KaTeX/):

The *Gamma function* satisfying $\Gamma(n) = (n-1)!\quad\forall n\in\mathbb N$ is via the Euler integral

$$
\Gamma(z) = \int_0^\infty t^{z-1}e^{-t}dt\,.
$$

> You can find more information about **LaTeX** mathematical expressions [here](http://meta.math.stackexchange.com/questions/5020/mathjax-basic-tutorial-and-quick-reference).


## UML diagrams

You can render UML diagrams using [Mermaid](https://mermaidjs.github.io/). For example, this will produce a sequence diagram:

```mermaid
sequenceDiagram
Alice ->> Bob: Hello Bob, how are you?
Bob-->>John: How about you John?
Bob--x Alice: I am good thanks!
Bob-x John: I am good thanks!
Note right of John: Bob thinks a long<br/>long time, so long<br/>that the text does<br/>not fit on a row.

Bob-->Alice: Checking with John...
Alice->John: Yes... John, how are you?
```

And this will produce a flow chart:

```mermaid
graph LR
A[Square Rect] -- Link text --> B((Circle))
A --> C(Round Rect)
B --> D{Rhombus}
C --> D
```
