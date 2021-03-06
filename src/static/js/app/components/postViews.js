/** @jsx React.DOM */

/*
** postViews.js
** Copyright QILabs.org
** BSD License
** by @f03lipe
*/

define(['jquery', 'backbone', 'underscore', 'components.postModels', 'react', 'medium-editor',],
	function ($, Backbone, _, postModels, React) {

	var mediumEditorAnswerOpts = {
		firstHeader: 'h1',
		secondHeader: 'h2',
		buttons: ['bold', 'italic', 'quote', 'anchor', 'underline', 'orderedlist'],
		buttonLabels: {
			quote: '<i class="icon-quote"></i>',
			orderedlist: '<i class="icon-list"></i>',
			anchor: '<i class="icon-link"></i>'
		}
	};

	/* React.js views */

	var EditablePost = {
		onClickTrash: function () {
			if (confirm('Tem certeza que quer excluir essa postagem?')) {
				this.props.model.destroy();
			}
		},
	};

	var backboneCollection = {
		componentWillMount: function () {
			var update = function () {
				this.forceUpdate(function(){});
			}
			this.props.collection.on('add reset change remove', update.bind(this));
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
							React.DOM.span( {dangerouslySetInnerHTML:{__html: comment.content.escapedBody }})
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

							React.DOM.time( {'data-time-count':1*new Date(comment.published)}, 
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
				var self = this;
				// This only works because showInput starts out as false.
				if (this.refs && this.refs.input) {
					this.refs.input.getDOMNode().focus();
					$(this.refs.input.getDOMNode()).autosize();
					if (this.props.small) {
						$(this.refs.input.getDOMNode()).keyup(function (e) {
							// Prevent newlines in comments.
							if (e.keyCode == 13) { // enter
								e.preventDefault();
							} else if (e.keyCode == 27) { // esc
								// Hide box if the content is "empty".
								if (self.refs.input.getDOMNode().value.match(/^\s*$/))
									self.setState({showInput:false});
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
				}).done(function (response) {
					if (response.error) {
						app.alert(response.message || 'Erro!', 'error');
					} else {
						self.setState({showInput:false});
						bodyEl.val('');
						self.props.model.children.Comment.add(new postModels.commentItem(response.data));
					}
				}).fail(function (xhr) {
					app.alert(xhr.responseJSON.message || 'Erro!', 'error');
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
					return (
						CommentView( {model:comment, key:comment.id} )
					);
				});

				return (
					React.DOM.div( {className:"commentList"}, 
						
							this.props.small?
							null
							:React.DOM.label(null, this.props.collection.models.length, " Comentário",this.props.collection.models.length>1?"s":""),
						

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
						CommentListView(  {small:this.props.small, placeholder:this.props.placeholder, collection:this.props.collection} ),
						CommentInputForm( {small:this.props.small, model:this.props.postModel} )
					)
				);
			},
		}),
	};

	//

	var Answer = {
		View: React.createClass({displayName: 'View',
			mixins: [backboneModel, EditablePost],

			getInitialState: function () {
				return {isEditing:false};
			},

			onClickEdit: function () {
				if (!this.editor) return;

				this.setState({isEditing:true});
				this.editor.activate();
			},

			componentDidMount: function () {
				if (window.user && this.props.model.get('author').id === window.user.id) {
					this.editor = new MediumEditor(this.refs.answerBody.getDOMNode(), mediumEditorAnswerOpts); 
					// No addons.
					$(this.refs.answerBody.getDOMNode()).mediumInsert({
						editor: this.editor,
						addons: {}
					});
					this.editor.deactivate();
				} else {
					this.editor = null;
				}
			},
			
			onClickSave: function () {
				if (!this.editor) return;

				var self = this;

				this.props.model.save({
					content: {
						body: this.editor.serialize()['element-0'].value,
					},
				}, {
					success: function () {
						self.setState({isEditing:false});
						self.forceUpdate();
					}
				});
			},

			componentWillUnmount: function () {
				if (this.editor) {
					this.editor.deactivate();
					$(this.editor.anchorPreview).remove();
					$(this.editor.toolbar).remove();
				}
			},

			componentDidUpdate: function () {
				if (this.editor) {
					if (!this.state.isEditing) {
						this.editor.deactivate(); // just to make sure
						$(this.refs.answerBody.getDOMNode()).html($(this.props.model.get('content').body));
					} else {
						this.editor.activate();
					}
				}
			},

			toggleVote: function () {
				this.props.model.handleToggleVote();
			},

			onCancelEdit: function () {
				if (!this.editor) return;
				this.setState({isEditing:false});
			},
			
			render: function () {
				var answer = this.props.model.attributes;
				var self = this;

				// <button className="control"><i className="icon-caret-up"></i></button>
				// <div className="voteResult">5</div>
				// <button className="control"><i className="icon-caret-down"></i></button>
				var userHasVoted = window.user && answer.votes.indexOf(window.user.id) != -1;
				var userIsAuthor = window.user && answer.author.id===window.user.id;

				var voteControl = (
					React.DOM.div( {className:" voteControl "+(userHasVoted?"voted":"")}, 
						React.DOM.button( {className:"thumbs", onClick:this.toggleVote, disabled:userIsAuthor?"disabled":"",
						title:userIsAuthor?"Você não pode votar na sua própria resposta.":""}, 
							React.DOM.i( {className:"icon-tup"})
						),
						React.DOM.div( {className:"count"}, 
							answer.voteSum
						)
					)
				);

				return (
					React.DOM.div( {className:"answerViewWrapper"}, 
						React.DOM.div( {className:" answerView "+(this.state.isEditing?" editing ":""), ref:"answerView"}, 
							React.DOM.div( {className:"left"}, 
								voteControl
							),
							React.DOM.div( {className:"right"}, 
								React.DOM.div( {className:"answerBodyWrapper", ref:"answerBodyWrapper"}, 
									React.DOM.div( {className:"answerBody", ref:"answerBody", dangerouslySetInnerHTML:{__html: answer.content.body }}
									)
								),
								React.DOM.div( {className:"infobar"}, 
									React.DOM.div( {className:"toolbar"}, 
										userIsAuthor?
										(
											React.DOM.div( {className:"item save", 'data-action':"save-post", onClick:this.onClickSave, 'data-toggle':"tooltip", 'data-placement':"bottom", title:"Salvar"}, 
												React.DOM.i( {className:"icon-save"})
											)
										):null,
										userIsAuthor?
										(
											React.DOM.div( {className:"item cancel", onClick:this.onCancelEdit, 'data-toggle':"tooltip", 'data-placement':"bottom", title:"Cancelar"}, 
												React.DOM.i( {className:"icon-times"})
											)
										):null,
										userIsAuthor?
										(
											React.DOM.div( {className:"item edit", onClick:this.onClickEdit, 'data-toggle':"tooltip", 'data-placement':"bottom", title:"Editar"}, 
												React.DOM.i( {className:"icon-pencil"})
											)
										):null,
										userIsAuthor?
										(
											React.DOM.div( {className:"item remove", 'data-action':"remove-post", onClick:this.onClickTrash,  'data-toggle':"tooltip", 'data-placement':"bottom", title:"Remover"}, 
												React.DOM.i( {className:"icon-trash"})
											)
										):null,
										React.DOM.div( {className:"item link", 'data-toggle':"tooltip", 'data-placement':"bottom", title:"Link"}, 
											React.DOM.i( {className:"icon-link"})
										),
										React.DOM.div( {className:"item flag",  'data-toggle':"tooltip", 'data-placement':"bottom", title:"Sinalizar conteúdo"}, 
											React.DOM.i( {className:"icon-flag"})
										)
									),
									React.DOM.div( {className:"answerAuthor"}, 
										React.DOM.div( {className:"avatarWrapper"}, 
											React.DOM.a( {href:answer.author.profileUrl}, 
												React.DOM.div( {className:"avatar", style: { background: 'url('+answer.author.avatarUrl+')' },  title:answer.author.username}
												)
											)
										),
										React.DOM.div( {className:"info"}, 
											React.DOM.a( {href:answer.author.profileUrl, className:"username"}, 
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
													
													userIsAuthor?null:React.DOM.button( {className:"btn-follow btn-follow", 'data-action':"unfollow", 'data-user':"{{ profile.id }}"})
													
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
						AnswerView( {model:answer, key:answer.id})
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
			mixins: [backboneCollection],
			getInitialState: function () {
				return {sortingType:'votes'};
			},
			onSortSelected: function (e) {
				var type = e.target.dataset.sort;
				console.log(e, type)

				var comp = this.props.collection.comparators[type];
				this.props.collection.comparator = comp;
				this.props.collection.sort();
				this.setState({sortingType: type});
			},
			render: function () {
				var self = this;

				var sortTypes = {
					'votes': 'Votos',
					'older': '+ Antigo',
					'younger': '+ Novo',
					'updated': 'Atividade',
				};

				var otherOpts = _.map(_.filter(_.keys(sortTypes), function (i) {
					return i != self.state.sortingType;
				}), function (type) {
					return (
						React.DOM.li( {'data-sort':type, onClick:self.onSortSelected}, sortTypes[type])
					);
				});

				var menu = (
					React.DOM.div( {className:"menu"}, 
						React.DOM.span( {className:"selected", 'data-sort':this.state.sortingType}, 
							sortTypes[this.state.sortingType],
							React.DOM.i( {className:"icon-adown"})
						),
						React.DOM.div( {className:"dropdown"}, 
							otherOpts
						)
					)
				);

				return (
					React.DOM.div( {className:"answerSection"}, 
						React.DOM.div( {className:"sectionHeader"}, 
							React.DOM.label(null,  this.props.collection.length,  " Resposta", this.props.collection.length==1?"":"s" ),
							React.DOM.div( {className:"sortingMenu"}, 
								React.DOM.label(null, "ordenar por"),
								menu
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
				if (this.refs && this.refs.input) {
					this.editor = new MediumEditor(this.refs.input.getDOMNode(), mediumEditorAnswerOpts);
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
					data: { content: { body: body } }
				}).done(function(response) {
					self.editor.innerHTML = "";
					self.setState({showInput:false});
					console.log('response', response);
					self.props.model.children.Answer.add(new postModels.answerItem(response));
				}).fail(function(response) {
					if (response.message) {
						app.alert(response.message,'error');
					} else
						app.alert('Erro!', 'error');
				});
			},

			showInput: function () {
				if (this.props.model.children.Answer.all(function (answer) {
					return answer.get('author').id != window.user.id;
				})) {
					this.setState({showInput:true});
				} else {
					app.alert('Você não pode responder à mesma pergunta mais de uma vez. Edite a sua resposta antiga se quiser adicionar mais informações.', 'danger');
				}
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
									:React.DOM.label(null, "Responder à pergunta \"",this.props.model.get('content').title,"\""),
								
									React.DOM.div( {className:"editorWrapper"}, 
										React.DOM.div( {className:"editor answerBody", ref:"input", name:"teste", 'data-placeholder':"Resposta da pergunta aqui..."})
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

	var PostHeader = React.createClass({displayName: 'PostHeader',
		mixins: [EditablePost],
		render: function () {
			var post = this.props.model.attributes;
			var userIsAuthor = window.user && post.author.id===window.user.id;

			return (
				React.DOM.div( {className:"postHeader"}, 
					React.DOM.div( {className:"type"}, 
						post.translatedType
					),
					React.DOM.div( {className:"tags"}, 
						TagList( {tags:post.tags} )
					),
					React.DOM.div( {className:"postTitle"}, 
						post.content.title
					),
					React.DOM.time( {'data-time-count':1*new Date(post.published)}, 
						window.calcTimeFrom(post.published)
					),

					React.DOM.div( {className:"authorInfo"}, 
						"por  ",
						React.DOM.div( {className:"avatarWrapper"}, 
							React.DOM.div( {className:"avatar", style: { background: 'url('+post.author.avatarUrl+')' } }),
							React.DOM.div( {className:"avatarPopup"}, 
								React.DOM.div( {className:"popupUserInfo"}, 
									React.DOM.div( {className:"popupAvatarWrapper"}, 
										React.DOM.div( {className:"avatar", style: { background: 'url('+post.author.avatarUrl+')' } })
									),
									React.DOM.a( {href:post.author.path, className:"popupUsername"}, 
										post.author.name
									),
									React.DOM.button( {className:"btn-follow btn-follow", 'data-action':"unfollow", 'data-user':post.author.id})
								),
								React.DOM.div( {className:"popupBio"}, 
									post.author.profile.bio
								)
							)
						),
						React.DOM.a( {href:post.author.path, className:"username"}, 
							post.author.name
						),
						
							userIsAuthor?
							null
							:React.DOM.button( {className:"btn-follow btn-follow", 'data-action':"unfollow", 'data-user':post.author.id})
						
					),

					
						(userIsAuthor)?
						React.DOM.div( {className:"flatBtnBox"}, 
							React.DOM.div( {className:"item edit", onClick:this.props.parent.onClickEdit}, 
								React.DOM.i( {className:"icon-edit"})
							),
							React.DOM.div( {className:"item remove", onClick:this.props.parent.onClickTrash}, 
								React.DOM.i( {className:"icon-trash"})
							),
							React.DOM.div( {className:"item link", onClick:this.props.parent.onClickLink}, 
								React.DOM.i( {className:"icon-link"})
							)
						)
						:React.DOM.div( {className:"flatBtnBox"}, 
							React.DOM.div( {className:"item like "+((window.user && post.votes.indexOf(window.user.id) != -1)?"liked":""),
								onClick:this.props.parent.toggleVote}, 
								React.DOM.i( {className:"icon-heart-o"}),React.DOM.span( {className:"count"}, post.voteSum)
							),
							React.DOM.div( {className:"item link", onClick:this.props.parent.onClickLink}, 
								React.DOM.i( {className:"icon-link"})
							),
							React.DOM.div( {className:"item flag", onClick:this.props.parent.onClickFlag}, 
								React.DOM.i( {className:"icon-flag"})
							)
						)
					
				)
			);
		}
	})

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

	var TagList = React.createClass({displayName: 'TagList',
		render: function () {
			var tags = _.map(this.props.tags, function (tagId) {
				return (
					React.DOM.div( {className:"tag", key:tagId}, 
						"#",tagMap[tagId].label
					)
				);
			});
			return (
				React.DOM.div( {className:"tags"}, 
					tags
				)
			);
		}
	})

	return {
		'CardView': React.createClass({
			mixins: [backboneModel],
			componentDidMount: function () {},
			render: function () {
				function gotoPost () {
					app.navigate('/posts/'+post.id, {trigger:true});
				}
				var post = this.props.model.attributes;
				var mediaUserStyle = {
					background: 'url('+post.author.avatarUrl+')',
				};

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
								post.type === "Question"?
									React.DOM.div(null, 
										React.DOM.i( {className:"icon-bulb"})," ",
										this.props.model.get('childrenCount').Answer
									)
									:React.DOM.div(null, 
										React.DOM.i( {className:"icon-comment-o"})," ",
										this.props.model.get('childrenCount').Comment
									)
								
							)
						),

						React.DOM.div( {className:"cardBody"}, 
							React.DOM.span( {ref:"cardBodySpan"}, post.content.title)
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

							React.DOM.time( {'data-time-count':1*new Date(post.published)}, 
								window.calcTimeFrom(post.published)
							)
						)
					)
				);
			}
		}),
		'Question': React.createClass({
			mixins: [EditablePost, backboneModel],

			render: function () {
				var post = this.props.model.attributes;
				var userIsAuthor = window.user && post.author.id===window.user.id;

				return (
					React.DOM.div(null, 
						PostHeader( {model:this.props.model, parent:this.props.parent} ),

						React.DOM.div( {className:"postBody", dangerouslySetInnerHTML:{__html: this.props.model.get('content').body}}
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
		'Experience': React.createClass({
			mixins: [EditablePost, backboneModel],

			render: function () {
				var post = this.props.model.attributes;
				return (
					React.DOM.div(null, 
						PostHeader( {model:this.props.model, parent:this.props.parent} ),

						React.DOM.div( {className:"postBody", dangerouslySetInnerHTML:{__html: this.props.model.get('content').body}}
						),

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
		'Tip': React.createClass({
			mixins: [EditablePost, backboneModel],

			render: function () {
				var post = this.props.model.attributes;
				return (
					React.DOM.div(null, 
						PostHeader( {model:this.props.model, parent:this.props.parent} ),

						React.DOM.div( {className:"postBody", dangerouslySetInnerHTML:{__html: this.props.model.get('content').body}}
						),

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

	};
});

