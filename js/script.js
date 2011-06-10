// Projects
var Project = Spine.Model.setup('Project', ['name', 'description', 'members', 'slug', 'main']);
Project.extend(Spine.Model.Local);
Project.fetch();

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
var currProj;
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
    // Create default project if one doesn't exist
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

  events: {
    'click a': 'selectProject'
  },

	init: function() {
		Project.bind('refresh change', this.proxy(this.render));
    this.render();

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

  selectProject: function(){
    ProjectDDButton.closeDropdown();
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

// Cards
var CardType = Spine.Model.setup('CardType',['name','type','color','order','project_id']);
CardType.bind('beforeSave',function(rec){
  rec.type = rec.name.toSlug();
  rec.order = this.all().length;
  rec.project_id = currProj.id;
});
CardType.extend(Spine.Model.Local);
CardType.fetch();

var CardColumns = Spine.Controller.create({
  el: $('#cards'),

  init: function(){
    CardType.bind('refresh change', this.proxy(this.render));
    this.render();
  },

  template: function(items){
    return $('#cardcol-tmpl').tmpl(items);
  },

  sort: function(items){
    return items.sort(function(a,b){
      return a.order > b.order;
    });
  },

  render: function(){
    this.el.html(this.template(this.sort(CardType.findAllByAttribute('project_id',currProj.id))));
  }
});

var Card = Spine.Model.setup('Card',['title','description','creator','assignee','type','project_id']);
Card.extend(Spine.Model.Local);
Card.fetch();

var Cards = Spine.Controller.create({
});

// Main app
var App = Spine.Controller.create({
	init: function() {
		this.routes({

			'': function() {
				this.navigate('/');
			},

      // Default project
			'/': function() {
				currProj = Project.findByAttribute('main', true);
				CurrentProject.render(currProj);
        CardColumns.init();
			},

      // Project detail
			'/:id': function(id) {
				currProj = Project.find(id);
        if(currProj.main) {
          this.navigate('/');
          return;
        }
				CurrentProject.render(currProj);
        CardColumns.init();
			}

		});
	}
}).init();

Spine.Route.setup();

