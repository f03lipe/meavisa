/** @jsx React.DOM */

/*
** postViews.js
** Copyright QILabs.org
** BSD License
** by @f03lipe
*/

define(['jquery', 'backbone', 'underscore', 'components.postModels', 'react', 'medium-editor',], function ($, Backbone, _, postModels, React) {

	/* React.js views */

	var EditablePost = {
		onClickEdit: function () { },
		onClickTrash: function () {
			if (confirm('Tem certeza que deseja excluir essa postagem?')) {
				this.props.model.destroy();
			}
		},
	};

	var backboneCollection = {
		componentWillMount: function () {
			var update = function () {
				this.forceUpdate(function(){});
			}
			this.props.collection.on('add reset remove', update.bind(this));
		},
	};

	var backboneModel = {
		componentWillMount: function () {
			var update = function () {
				this.forceUpdate(function(){});
			}
			this.props.model.on('add reset remove change', update.bind(this));
		},
	};

	//

	var Comment = {
		View: React.createClass({displayName: 'View',
			mixins: [EditablePost],
			render: function () {
				var comment = this.props.model.attributes;
				var self = this;

				var mediaUserAvatarStyle = {
					background: 'url('+comment.author.avatarUrl+')',
				};

				return (
					React.DOM.div( {className:"commentWrapper"}, 
						React.DOM.div( {className:"msgBody"}, 
							React.DOM.div( {className:"arrow"}),
							comment.data.escapedBody
						),
						React.DOM.div( {className:"infoBar"}, 
							React.DOM.a( {className:"userLink author", href:comment.author.profileUrl}, 
								React.DOM.div( {className:"avatarWrapper"}, 
									React.DOM.div( {className:"avatar", style:mediaUserAvatarStyle, title:comment.author.username}
									)
								),
								React.DOM.span( {className:"name"}, 
									comment.author.name
								)
							)," · ",

							React.DOM.time( {'data-time-count':1*new Date(comment.published), 'data-time-long':"true"}, 
								window.calcTimeFrom(comment.published)
							),

							(window.user && window.user.id === comment.author.id)?
								React.DOM.div( {className:"optionBtns"}, 
									React.DOM.button( {'data-action':"remove-post", onClick:this.onClickTrash}, 
										React.DOM.i( {className:"icon-trash"})
									)
								)
							:undefined
						)
					)
				);
			},
		}),
		InputForm: React.createClass({displayName: 'InputForm',

			getInitialState: function () {
				return {showInput:false};
			},

			componentDidUpdate: function () {
				if (this.refs.input) {
					$(this.refs.input.getDOMNode()).autosize();
					if (this.props.small) {
						$(this.refs.input.getDOMNode()).keypress(function (e) {
							if (e.keyCode == 13) {
								e.preventDefault();
							}
						});
					}
				}
			},

			showInput: function () {
				this.setState({showInput:true});
			},

			handleSubmit: function (evt) {
				evt.preventDefault();

				var bodyEl = $(this.refs.input.getDOMNode());
				var self = this;
				$.ajax({
					type: 'post',
					dataType: 'json',
					url: this.props.model.get('apiPath')+'/comments',
					data: { content: { body: bodyEl.val() } }
				}).done(function(response) {
					self.setState({showInput:false});
					bodyEl.val('');
					self.props.model.children.Comment.add(new postModels.commentItem(response.data));
				});

			},

			render: function () {
				if (!window.user)
					return (React.DOM.div(null));
				var mediaUserAvatarStyle = {
					background: 'url('+window.user.avatarUrl+')',
				};

				return (
					React.DOM.div(null, 
						
							this.state.showInput?(
								React.DOM.div( {className:"commentInputSection "+(this.props.small?"small":'')}, 
									React.DOM.form( {className:"formPostComment", onSubmit:this.handleSubmit}, 
										
											this.props.small?
											null
											:React.DOM.h4(null, "Comente essa publicação"),
										
										React.DOM.textarea( {required:"required", ref:"input", type:"text", placeholder:"Seu comentário aqui..."}),
										React.DOM.button( {'data-action':"send-comment", onClick:this.handleSubmit}, "Enviar")
									)
								)
							):(
								React.DOM.div( {className:"showInput", onClick:this.showInput}, 
									this.props.model.get('type') === "Answer"?
									"Adicionar comentário."
									:"Fazer comentário sobre essa pergunta."
								)
							)
						
					)
				);
			},
		}),
		ListView: React.createClass({displayName: 'ListView',
			mixins: [backboneCollection],

			render: function () {
				var commentNodes = this.props.collection.map(function (comment) {
					return CommentView({model:comment});
				});

				return (
					React.DOM.div( {className:"commentList"}, 
						commentNodes
					)
				);
			},
		}),
		SectionView: React.createClass({displayName: 'SectionView',
			mixins: [backboneCollection],

			render: function () {
				if (!this.props.collection)
					return React.DOM.div(null);
				return (
					React.DOM.div( {className:"commentSection "+(this.props.small?' small ':'')}, 
						
							this.props.small?
							null
							:React.DOM.div( {className:"info"}, this.props.collection.models.length, " Comentários"),
						
						CommentListView( {placeholder:this.props.placeholder, collection:this.props.collection} ),
						CommentInputForm( {small:true, model:this.props.postModel} )
					)
				);
			},
		}),
	};

	//

	var Answer = {
		View: React.createClass({displayName: 'View',
			mixins: [EditablePost],
			render: function () {
				var answer = this.props.model.attributes;
				var self = this;

				var mediaUserAvatarStyle = {
					background: 'url('+answer.author.avatarUrl+')',
				};

				return (
					React.DOM.div( {className:"answerViewWrapper"}, 
						React.DOM.div( {className:"answerView"}, 
							React.DOM.table(null, 
							React.DOM.tr(null, 
								React.DOM.td( {className:"left"}, 
									React.DOM.div( {className:"voteControl"}, 
										React.DOM.button( {className:"control"}, React.DOM.i( {className:"icon-caret-up"})),
										React.DOM.div( {className:"voteResult"}, "5"),
										React.DOM.button( {className:"control"}, React.DOM.i( {className:"icon-caret-down"}))
									)
								),
								React.DOM.td( {className:"right"}, 
									React.DOM.div( {className:"answerBody"}, 
										React.DOM.div( {className:"msgBody"}, 
											React.DOM.span( {dangerouslySetInnerHTML:{__html: answer.data.escapedBody }} )
										),
										React.DOM.div( {className:"arrow"})
									),
									React.DOM.div( {className:"toolbar"}, 
										(window.user && answer.author.id===window.user.id)?
										(
											React.DOM.div( {className:"item edit"}, 
												React.DOM.i( {className:"icon-pencil"})
											)
										):null,
										(window.user && answer.author.id===window.user.id)?
										(
											React.DOM.div( {className:"item trash", 'data-action':"remove-post", onClick:this.onClickTrash}, 
												React.DOM.i( {className:"icon-trash"})
											)
										):null,
										React.DOM.div( {className:"item link"}, 
											React.DOM.i( {className:"icon-link"})
										),
										React.DOM.div( {className:"item flag"}, 
											React.DOM.i( {className:"icon-flag"})
										)
									),
									React.DOM.div( {className:"answerAuthor"}, 
										React.DOM.div( {className:"avatarWrapper"}, 
											React.DOM.a( {href:answer.author.profileUrl}, 
												React.DOM.div( {className:"avatar", style:mediaUserAvatarStyle, title:answer.author.username}
												)
											)
										),
										React.DOM.div( {className:"info"}, 
											React.DOM.span( {className:"username"}, 
												answer.author.name
											), " ", React.DOM.time( {'data-time-count':1*new Date(answer.published)}, 
												window.calcTimeFrom(answer.published)
											)
										),
										React.DOM.div( {className:"answerSidebar", ref:"sidebar"}, 
											React.DOM.div( {className:"box authorInfo"}, 
												React.DOM.div( {className:"identification"}, 
													React.DOM.div( {className:"avatarWrapper"}, 
														React.DOM.div( {className:"avatar", style: { background: 'url('+answer.author.avatarUrl+')' } })
													),
													React.DOM.a( {href:answer.profileUrl, className:"username"}, 
														answer.author.name
													),
													React.DOM.button( {className:"btn-follow btn-follow", 'data-action':"unfollow", 'data-user':"{{ profile.id }}"})
												),
												React.DOM.div( {className:"bio"}, 
													
														(answer.author.profile.bio.split(" ").length>20)?
														answer.author.profile.bio.split(" ").slice(0,20).join(" ")+"..."
														:answer.author.profile.bio
													
												)
											)
										)
									)
								)
							)
							),
							CommentSectionView( {small:true, collection:this.props.model.children.Comment, postModel:this.props.model} )
						)
					)
				);
			},
		}),
		ListView: React.createClass({displayName: 'ListView',
			componentWillMount: function () {
				var update = function () {
					this.forceUpdate(function(){});
				}
				this.props.collection.on('add reset remove', update.bind(this));
			},

			render: function () {
				var answerNodes = this.props.collection.map(function (answer) {
					return (
						AnswerView( {model:answer} )
					);
				});

				return (
					
					React.DOM.div( {className:"answerList"}, 
						answerNodes
					)
				);
			},
		}),
		SectionView: React.createClass({displayName: 'SectionView',
			render: function () {
				return (
					React.DOM.div( {className:"answerSection"}, 
						React.DOM.div( {className:"sectionHeader"}, 
							React.DOM.label(null,  this.props.collection.length,  " Respostas"),
							React.DOM.div( {className:"sortingMenu"}, 
								React.DOM.label(null, "ordenar por"),
								React.DOM.div( {className:"menu"}, 
									React.DOM.span( {className:"selected"}, "Votos ", React.DOM.i( {className:"icon-adown"})),
									React.DOM.div( {className:"dropdown"}, 
										React.DOM.li(null, "+ Antigo"),
										React.DOM.li(null, "Atividade")
									)
								)
							)
						),
						AnswerListView( {collection:this.props.collection} ),
						AnswerInputForm( {model:this.props.postModel, placeholder:"Adicionar comentário."})
					)
				);
			},
		}),
		InputForm: React.createClass({displayName: 'InputForm',

			componentDidUpdate: function () {
				if (this.refs.input) {
					this.editor = new MediumEditor(this.refs.input.getDOMNode(), {
						firstHeader: 'h1',
						secondHeader: 'h2',
						buttons: ['bold', 'italic', 'quote', 'anchor', 'underline', 'orderedlist'],
						buttonLabels: {
							quote: '<i class="icon-quote"></i>',
							orderedlist: '<i class="icon-list"></i>'
						}
					});
					e = this.editor;
				}
			},

			getInitialState: function () {
				return {showInput:false};
			},

			handleSubmit: function (evt) {
				evt.preventDefault();

				if (!this.editor) return alert("WTF"); // WTF

				var body = this.editor.serialize()['element-0'].value;
				var self = this;
				$.ajax({
					type: 'post',
					dataType: 'json',
					url: this.props.model.get('apiPath')+'/answers',
					data: { body: body }
				}).done(function(response) {
					self.editor.innerHTML = "";
					self.setState({showInput:false});
					console.log('response', response);
					self.props.model.children.Answer.add(new postModels.answerItem(response.data));
				});
			},

			showInput: function () {
				this.setState({showInput:true});
			},

			render: function () {
				if (!window.user)
					return (React.DOM.div(null));

				var mediaUserAvatarStyle = {
					background: 'url('+window.user.avatarUrl+')',
				};

				return (
					React.DOM.div(null, 
					
						this.state.showInput?(
							React.DOM.div( {className:"answerInputSection "+(this.props.small?"small":'')}, 
								React.DOM.form( {className:"formPostAnswer", onSubmit:this.handleSubmit}, 
								
									this.props.small?
									null
									:React.DOM.label(null, "Responda à pergunta \"",this.props.model.get('data').title,"\""),
								
									React.DOM.div( {className:"editorWrapper"}, 
										React.DOM.div( {className:"editor", ref:"input", name:"teste", 'data-placeholder':"Resposta da pergunta aqui..."})
									),
									React.DOM.button( {'data-action':"send-answer", onClick:this.handleSubmit}, "Enviar")
								)
							)
						):(
							React.DOM.div( {className:"showInput", onClick:this.showInput}, 
								"Responder pergunta."
							)
						)
					
					)
				);
			},
		}),
	};

	//

	var CommentSectionView = Comment.SectionView;
	var CommentListView = Comment.ListView;
	var CommentInputForm = Comment.InputForm;
	var CommentView = Comment.View;
	var AnswerSectionView = Answer.SectionView;
	var AnswerListView = Answer.ListView;
	var AnswerInputForm = Answer.InputForm;
	var AnswerView = Answer.View;

	//

	var CardView = React.createClass({displayName: 'CardView',
		mixins: [backboneModel],
		render: function () {

			function gotoPost () {
				app.navigate('#posts/'+post.id, {trigger:true});
				// app.navigate('')
			}
			var post = this.props.model.attributes;
			var mediaUserStyle = {
				background: 'url('+post.author.avatarUrl+')',
			};
			var rawMarkup = post.data.escapedBody;

			return (
				React.DOM.div( {className:"cardView", onClick:gotoPost}, 
					
					React.DOM.div( {className:"cardHeader"}, 
						React.DOM.span( {className:"cardType"}, 
							post.translatedType
						),
						React.DOM.div( {className:"iconStats"}, 
							React.DOM.div( {onClick:this.props.model.handleToggleVote.bind(this.props.model)}, 
								this.props.model.liked?React.DOM.i( {className:"icon-heart icon-red"}):React.DOM.i( {className:"icon-heart"}),
								" ",
								post.voteSum
							),
							React.DOM.div(null, 
								React.DOM.i( {className:"icon-comment-o"})," ",
								this.props.model.get('childrenCount').Comment
							),
							post.type === "QA"?
								React.DOM.div(null, 
									React.DOM.i( {className:"icon-bulb"})," ",
									this.props.model.get('childrenCount').Answer
								)
								:null
						)
					),

					React.DOM.div( {className:"cardBody"}, 
						React.DOM.span( {dangerouslySetInnerHTML:{__html: post.data.title }} )
					),

					React.DOM.div( {className:"cardFoot"}, 
						React.DOM.div( {className:"authorship"}, 
							React.DOM.a( {href:post.author.profileUrl, className:"username"}, 
								post.author.name
							),
							React.DOM.div( {className:"avatarWrapper"}, 
								React.DOM.a( {href:post.author.profileUrl}, 
									React.DOM.div( {className:"avatar", style:mediaUserStyle})
								)
							)
						),

						React.DOM.time( {'data-time-count':1*new Date(post.published), 'data-time-long':"true"}, 
							window.calcTimeFrom(post.published,true)
						)
					)
				)
			);
		}
	});

	return {
		'CardView': CardView,
		'PlainPost': React.createClass({
			mixins: [EditablePost, backboneModel],

			render: function () {
				var post = this.props.model.attributes;
				var rawMarkup = post.data.escapedBody;

				var postBody = (
					React.DOM.div( {className:"postBody"}, 
						React.DOM.p(null, 
							"It's been over five years since the day I first learned about the existence of MIT."
						),
						"You know MIT, right?",

						React.DOM.img( {src:"http://sloansocialimpact.mit.edu/wp-content/uploads/2014/02/MIT_Dome_night1_Edit.jpg"} ),

						React.DOM.small(null, "The pornographically-cool MIT Dome."),

						React.DOM.blockquote(null, 
							"Massachusetts Institute of Technology (MIT) is a private research university in Cambridge, Massachusetts known traditionally for research and education in the physical sciences and engineering",
							React.DOM.footer(null, React.DOM.a( {href:"http://en.wikipedia.org/wiki/Massachusetts_Institute_of_Technology"}, "Wikipedia"))
						),

						React.DOM.p(null, 
							"But MIT isn't just any \"private research university\", though: it's arguably the best technology"+' '+
							"university in the world."
						),
						React.DOM.hr(null ),
						React.DOM.p(null, 
							"Someday in 2009, while surfing around the internet, in an uncalculated move, I clicked a link on Info Magazine homepage,"+' '+
							"taking me to ", React.DOM.a( {href:"http://info.abril.com.br/noticias/internet/aulas-do-mit-e-de-harvard-gratis-no-youtube-09042009-18.shl"}, "this post"),"."+' '+
							"\"Free MIT and Harvard classes on Youtube\", it said."
						),
						React.DOM.h2(null, React.DOM.q(null, "MIT??")),
						React.DOM.p(null, "Harvard I had heard of, sure. But ", React.DOM.q(null, "what is MIT?"), " The choice to google it (rather than just leaving it be), was one that changed my life."
						),
						React.DOM.p(null, 
							"No... ", React.DOM.em(null, "seriously"),".",React.DOM.br(null ),
							"I kept reading about it for hours, days even, I presume, because next thing you know MIT was my obsession."+' '+
							"I began collecting MIT wallpapers – admittedly I still do that –,"+' '+
							"and videos related to the institution, including one of ", React.DOM.a( {href:"https://www.youtube.com/watch?v=jJ5EwCA2H4Y"}, "Burton Conner students singing Switch"),"."
						),
						React.DOM.h2(null, "MIT OpenCourseWare"),
						React.DOM.p(null, 
							"Another important MIT-related collection was one of CD-ROMs filled with OCW classes. The MIT OpenCourseWare is an MIT project lauched in 2002 that aims at providing MIT courses videolectured for free (as in beer). The first video I watched was a 2007 version of Gilbert Strang's Linear Algebra lectures. I didn't get past the 6th video. I also watched Single Variable Calculus course, and, of course, Walter Lewin's Classical Mechanics. I must have burned half a dozen CDs with these video-lectures. I don't know why."
						),
						React.DOM.iframe( {width:"720", height:"495", src:"//www.youtube.com/embed/ZK3O402wf1c", frameborder:"0", allowfullscreen:true}),
						React.DOM.small(null, "Seriously, what a sweet guy."),

						
						React.DOM.h2(null, "MIT Media Lab"),
						React.DOM.img( {src:"http://upload.wikimedia.org/wikipedia/commons/b/ba/The_MIT_Media_Lab_-_Flickr_-_Knight_Foundation.jpg"} ),
						
						React.DOM.h1(null),
						React.DOM.code(null, 
							"oi"
						),

						React.DOM.pre(null, "var postType = this.props.model.get('type')")
					)
				);

				return (
					React.DOM.div(null, 
						React.DOM.div( {className:"postHeader"}, 
							React.DOM.time( {'data-time-count':1*new Date(post.published), 'data-time-long':"true"}, 
								window.calcTimeFrom(post.published,true)
							),
							React.DOM.div( {className:"type"}, 
								post.translatedType
							),
							React.DOM.div( {className:"postTitle"}, 
								"From OCW fanatic to MIT undergrad: my 5 year journey"
							),
							React.DOM.div( {className:"tags"}, 
								React.DOM.div( {className:"tag"}, "Application"),
								React.DOM.div( {className:"tag"}, "Vestibular"),
								React.DOM.div( {className:"tag"}, "Universidades")
							)
						),
						postBody,
						React.DOM.div( {className:"postInfobar"}, 
							React.DOM.ul( {className:"left"}
							)
						),
						React.DOM.div( {className:"postFooter"}, 
							CommentSectionView( {collection:this.props.model.children.Comment, postModel:this.props.model} )
						)
					)
				);
			},
		}),
		'Question': React.createClass({
			mixins: [EditablePost, backboneModel],

			render: function () {
				var post = this.props.model.attributes;
				var rawMarkup = post.data.escapedBody;

				return (
					React.DOM.div(null, 
						React.DOM.div( {className:"postHeader"}, 
							React.DOM.time( {'data-time-count':1*new Date(post.published), 'data-time-long':"true"}, 
								window.calcTimeFrom(post.published,true)
							),
							React.DOM.div( {className:"type"}, 
								post.translatedType
							),
							React.DOM.div( {className:"postTitle"}, 
								post.data.title
							),
							React.DOM.div( {className:"tags"}, 
								React.DOM.div( {className:"tag"}, "Application"),
								React.DOM.div( {className:"tag"}, "Olimpíada de Matemática")
							)
						),
						React.DOM.div( {className:"postBody"}, 
							React.DOM.span( {dangerouslySetInnerHTML:{__html: rawMarkup}} )
						),
						React.DOM.div( {className:"postInfobar"}, 
							React.DOM.ul( {className:"left"}
							)
						),
						React.DOM.div( {className:"postFooter"}, 
							CommentSectionView( {collection:this.props.model.children.Comment, postModel:this.props.model, small:true} ),
							AnswerSectionView( {collection:this.props.model.children.Answer, postModel:this.props.model} )
						)
					)
				);
			},
		}),
	};
});

