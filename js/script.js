// Projects
var Project = Spine.Model.setup('Project', ['name', 'description', 'members', 'slug', 'main']);
Project.extend(Spine.Model.Local);


// Drop down button
var ProjectDDButton = Spine.Controller.create({
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
var CurrentProject = Spine.Controller.create({
	el: $('#currproj'),

	events: {
		'mouseenter': 'showEditableHint',
		'mouseleave': 'hideEditableHint',
		'click': 'enterEditMode',
		'blur': 'exitEditMode',
		'keydown': 'edit'
	},

  init: function(){
    var defaultProj = Project.findByAttribute('main',true);
    if (!defaultProj){
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
		ProjectDDButton.closeDropdown();
		this.rename();
	}

}).init();

// Project selector
var Projects = Spine.Controller.create({
	el: $('#listproj'),

	init: function() {
		Project.bind('refresh change', this.proxy(this.render));
		Project.fetch();

		// Create a new project
		$('#addproj').bind('click', function() {
			var projName = prompt('What would you like to call this new board?');
			var newProj = Project.create({
				name: projName,
				slug: projName.toSlug()
			});
			Spine.Route.navigate('', newProj.id);
			return false;
		});

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

var App = Spine.Controller.create({
	init: function() {
		this.routes({

			'': function() {
				this.navigate('/');
			},

			'/': function() {
				var proj = Project.findByAttribute('main', true);
				CurrentProject.render(proj);
			},

			'/:id': function(id) {
				var proj = Project.find(id);
        if(proj.main) this.navigate('/');
				CurrentProject.render(proj);
				ProjectDDButton.closeDropdown();
			}

		});
	}
}).init();

Spine.Route.setup();

