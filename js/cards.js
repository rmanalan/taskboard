// Cards
/***** Models *****/

// Card type used for card columns
var CardType = Spine.Model.setup('CardType', ['name', 'type', 'color', 'order', 'project_id']);
CardType.bind('beforeSave', function(rec) {
	rec.type = rec.name.toSlug();
	rec.order = this.all().length;
	rec.project_id = currProj.id;
});
CardType.extend(Spine.Model.Local);
CardType.fetch();

// Card
var Card = Spine.Model.setup('Card', ['title', 'description', 'creator', 'assignee', 'type', 'project_id']);
Card.extend(Spine.Model.Local);
Card.fetch();

/***** Controllers ******/

var CardEditorController = Spine.Controller.create({
  el: $('#card-editor'),

  events: {
    'submit #card-form': 'save'
  },

  show: function(type){
    $('[name=type]',this.el).val(type); // set the type based on the button pressed
    $('[name=project_id]',this.el).val(currProj.id);
    this.el.removeClass('hidden');
  },

  hide: function(){
    this.el.addClass('hidden');
  },

  save: function(e){
    Card.create($(e.target).serializeObject());
    this.hide();
    return false;
  }

}).init();

var CardColumnsController = Spine.Controller.create({
	el: $('#cards'),

	events: {
		'click button.cardbutton': 'createCard'
	},

	init: function() {
		CardType.bind('refresh change', this.proxy(this.render));
		this.render();
	},

	template: function(items) {
		return $('#cardcol-tmpl').tmpl(items);
	},

	sort: function(items) {
		return items.sort(function(a, b) {
			return a.order > b.order;
		});
	},

	render: function() {
		this.el.html(this.template(this.sort(CardType.findAllByAttribute('project_id', currProj.id))));
    CardType.each(function(type){
      console.log(type);
      $('#cardcol-'+type.type).html($('#card-tmpl').tmpl(Card.findAllByAttribute('type',type.type)));
    });
	},

	createCard: function(e) {
    CardEditorController.show($(e.target).data('type'));
	}
});

var CardItemController = Spine.Controller.create({

  proxied: ['render', 'remove'],

  init: function(){
    this.card.bind('update', this.render);
    this.card.bind('destroy', this.remove);
  },

  render: function(card){
    if(card) this.card = card;
    this.el.html(this.template(this.card));
    return this;
  },

  template: function(cards){
    return $('#card-tmpl').tmpl(cards);
  },

  remove: function(){
    this.el.remove();
  }
});

var CardsController = Spine.Controller.create({
  proxied: ['addAll', 'addOne'],

  init:function(){
    Card.bind('refresh', this.addAll);
    Card.bind('create', this.addOne);
  },

  addOne: function(card){
    var cardItem = CardItemController.init({card:card});
    $('#cardcol-'+card.type).append(cardItem.render().el);
  },

  addAll: function(){
    console.log('1');
    Card.each(this.AddOne);
  }

}).init();

