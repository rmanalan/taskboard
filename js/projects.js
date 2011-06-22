// Projects
/***** Models ******/
var Project = Spine.Model.setup('Project', ['name', 'description', 'members', 'slug', 'main']);
Project.extend(Spine.Model.Local);
Project.fetch();

/***** Controllers *****/

// Drop down button
var ProjectDDButtonController = Spine.Controller.create({
	el: $('#projddbutton'),

	events: {
		'click': 'toggleDropdown'
	},

	toggleDropdown: function() {
		$('#projdd').toggleClass('navddopen');
		this.el.toggleClass('navddbuttonopen');
		return false;
	},

	closeDropdown: function() {
		$('#projdd').removeClass('navddopen');
		this.el.removeClass('navddbuttonopen');
	}
}).init();

// Current project
var currProj;
var CurrentProjectController = Spine.Controller.create({
	el: $('#currproj'),

	events: {
		'mouseenter': 'showEditableHint',
		'mouseleave': 'hideEditableHint',
		'click': 'enterEditMode',
		'blur': 'exitEditMode',
		'keydown': 'edit'
	},

	init: function() {
		// Create default project if one doesn't exist
		var defaultProj = Project.findByAttribute('main', true);
		if (!defaultProj) {
			defaultProj = Project.create({
				name: "Whiteboard",
				main: true,
				description: "Default board",
				slug: "/"
			});
			this.render(defaultProj);
		}
	},

	render: function(proj) {
		this.el.html(proj.name).data('id', proj.id);
	},

	showEditableHint: function() {
		if (document.body.contentEditable !== null) {
			this.el.addClass('editmode');
		}
	},

	hideEditableHint: function() {
		this.el.removeClass('editmode');
	},

	enterEditMode: function() {
		if (document.body.contentEditable !== null) {
			this.el.attr('contenteditable', true).addClass('editmode');
		}
	},

	edit: function(e) {
		if (e.keyCode === 13) {
			this.exitEditMode();
			return false;
		}
	},

	rename: function() {
		Project.update(this.el.data('id'), {
			name: this.el.text()
		});
	},

	exitEditMode: function() {
		this.el.removeClass('editmode').attr('contenteditable', false);
		ProjectDDButtonController.closeDropdown();
		this.rename();
	}

}).init();

var AddProjectController = Spine.Controller.create({
	el: $('#addproj'),

	events: {
		'click': 'addNewProject'
	},

	addNewProject: function() {
		var projName = prompt('What would you like to call this new board?');
		var newProj = Project.create({
			name: projName,
			slug: projName.toSlug()
		});
		Spine.Route.navigate('', newProj.id);
		return false;
	}
}).init();

// Project selector
var ProjectsController = Spine.Controller.create({
	el: $('#listproj'),

	events: {
		'click a': 'selectProject'
	},

	init: function() {
		Project.bind('refresh change', this.proxy(this.render));
		this.render();
	},

	selectProject: function() {
		ProjectDDButtonController.closeDropdown();
	},

	template: function(items) {
		return $("#projlist-tmpl").tmpl(items);
	},

	sortByName: function(items) {
		return items.sort(function(a, b) {
			return a.name.toLowerCase() > b.name.toLowerCase();
		});
	},

	render: function() {
		this.el.html(this.template(this.sortByName(Project.all())));
	}

}).init();

