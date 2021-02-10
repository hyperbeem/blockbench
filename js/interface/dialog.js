(function() {

function buildForm(dialog) {
	let dialog_content = $(dialog.object).find('.dialog_content')
	for (var form_id in dialog.form) {
		let data = dialog.form[form_id]
		form_id = form_id.replace(/"/g, '');
		if (data === '_') {
			dialog_content.append('<hr />')
			
		} else {
			var bar = $(`<div class="dialog_bar form_bar form_bar_${form_id}"></div>`)
			if (data.label) {
				bar.append(`<label class="name_space_left" for="${form_id}">${tl(data.label)+(data.nocolon?'':':')}</label>`)
				dialog.max_label_width = Math.max(getStringWidth(tl(data.label)), dialog.max_label_width)
			}
			if (data.description) {
				bar.attr('title', tl(data.description))
			}
			var input_element;

			switch (data.type) {
				default:
					input_element = Object.assign(document.createElement('input'), {
						type: 'text',
						className: 'dark_bordered half focusable_input',
						id: form_id,
						value: data.value||'',
						placeholder: data.placeholder||'',
						oninput() {
							dialog.updateFormValues()
						}
					});
					bar.append(input_element)

					if (data.list) {
						input_element.list = `${dialog.id}_${form_id}_list`;
						let list = $(`<datalist id="${input_element.list}"></datalist>`);
						for (let value of data.list) {
							let node = document.createElement('option');
							node.value = value;
							list.append(node);
						}
						bar.append(list);
					}
					if (data.type == 'password') {
						bar.append(`<div class="password_toggle">
								<i class="fas fa-eye-slash"></i>
							</div>`)
						input_element.type = 'password';
						let hidden = true;
						let this_bar = bar;
						let this_input_element = input_element;
						this_bar.find('.password_toggle').on('click', e => {
							hidden = !hidden;
							this_input_element.attr('type', hidden ? 'password' : 'text');
							this_bar.find('.password_toggle i')[0].className = hidden ? 'fas fa-eye-slash' : 'fas fa-eye';
						})
					}
					break;
				case 'textarea':
					input_element = Object.assign(document.createElement('textarea'), {
						className: 'focusable_input',
						id: form_id,
						value: data.value||'',
						placeholder: data.placeholder||'',
						oninput() {
							dialog.updateFormValues()
						}
					});
					input_element.style.height = (data.height || 150) + 'px';
					bar.append(input_element)
					break;


				case 'select':
					var el = $(`<div class="bar_select half"><select class="focusable_input" id="${form_id}"></select></div>`)
					input_element = el.find('select')
					for (var key in data.options) {
						var name = tl(data.options[key])
						input_element.append(`<option id="${key}" ${(data.value === key || (data.default || data.value) === key) ? 'selected' : ''}>${name}</option>`)
					}
					bar.append(el)
					input_element.on('change', () => {
						dialog.updateFormValues()
					})
					break;


				case 'radio':
					var el = $(`<div class="half form_part_radio" id="${form_id}"></div>`)
					for (var key in data.options) {
						var name = tl(data.options[key])
						el.append(`<div class="form_bar_radio">
							<input type="radio" class="focusable_input" name="${form_id}_radio" id="${key}" ${(data.default || data.value) === key ? 'selected' : ''}>
							<label for="${key}">${name}</label>
						</div>`)
						input_element = el.find(`input#${key}`);
						input_element.on('change', () => {
							dialog.updateFormValues()
						})
					}
					bar.append(el)
					break;


				case 'info':
					data.text = marked(tl(data.text))
					bar.append(`<p>${data.text}</p>`)
					bar.addClass('small_text')
					break;


				case 'number':
					input_element = $(`<input class="dark_bordered half focusable_input" type="number" id="${form_id}"
						value="${parseFloat(data.value)||0}" min="${data.min}" max="${data.max}" step="${data.step||1}">`)
					bar.append(input_element)
					input_element.on('change', () => {
						dialog.updateFormValues()
					})
					break;


				case 'vector':
					let group = $(`<div class="dialog_vector_group half"></div>`)
					bar.append(group)
					for (var i = 0; i < (data.dimensions || 3); i++) {
						input_element = $(`<input class="dark_bordered focusable_input" type="number" id="${form_id}_${i}"
							value="${data.value ? parseFloat(data.value[i]): 0}" step="${data.step||1}" min="${data.min}" max="${data.max}">`)
						group.append(input_element)
						input_element.on('input', () => {
							dialog.updateFormValues()
						})
					}
					break;


				case 'color':
					if (!data.colorpicker) {
						data.colorpicker = new ColorPicker({
							id: 'cp_'+form_id,
							name: tl(data.label),
							label: false,
							private: true
						})
					}
					data.colorpicker.onChange = function() {
						dialog.updateFormValues()
					};
					bar.append(data.colorpicker.getNode())
					break;


				case 'checkbox':
					input_element = $(`<input type="checkbox" class="focusable_input" id="${form_id}"${data.value ? ' checked' : ''}>`)
					bar.append(input_element)
					input_element.on('change', () => {
						dialog.updateFormValues()
					})
					break;


				case 'file':
				case 'folder':
				case 'save':
					if (data.type == 'folder' && !isApp) break;

					var input = $(`<input class="dark_bordered half" class="focusable_input" type="text" id="${form_id}" disabled>`);
					input[0].value = data.value || '';
					bar.append(input);
					bar.addClass('form_bar_file');

					switch (data.type) {
						case 'file': 	bar.append('<i class="material-icons">insert_drive_file</i>'); break;
						case 'folder':	bar.append('<i class="material-icons">folder</i>'); break;
						case 'save':	bar.append('<i class="material-icons">save</i>'); break;
					}
					let remove_button = $('<div class="tool" style="float: none; vertical-align: top;"><i class="material-icons">clear</i></div>');
					bar.append(remove_button);
					remove_button.on('click', e => {
						e.stopPropagation();
						data.value = '';
						input.val('');
					})

					bar.on('click', e => {
						let path;
						function fileCB(files) {
							data.value = files[0].path;
							data.bar[0].children.item(1).value = data.value;
							dialog.updateFormValues()
						}
						// ALTERED: 10/02/2021
						switch (data.type) {
							case 'file':
								path = Blockbench.pick({
									startpath: data.value,
								}, 'openFile')
								if (path) fileCB([{path}]);
								break;
							case 'folder':
								path = Blockbench.pick({
									startpath: data.value,
								}, 'openDirectory')
								if (path) fileCB([{path}]);
								break;
							case 'save':
								Blockbench.export({
									resource_id: data.resource_id,
									extensions: data.extensions,
									type: data.filetype,
									startpath: data.value,
									custom_writer: () => {},
								}, fileCB);
								break;
						}
					})

			}
			if (data.readonly) {
				bar.find('input').attr('readonly', 'readonly').removeClass('focusable_input')
			}
			dialog_content.append(bar)
			data.bar = bar;
		}
	}
	dialog.updateFormValues(true)
}
function buildLines(dialog) {
	let dialog_content = $(dialog.object).find('.dialog_content')
	dialog.lines.forEach(l => {
		if (typeof l === 'object' && (l.label || l.widget)) {

			var bar = $('<div class="dialog_bar"></div>')
			if (l.label) {
				bar.append('<label class="name_space_left">'+tl(l.label)+(l.nocolon?'':':')+'</label>')
				dialog.max_label_width = Math.max(getStringWidth(tl(l.label)), dialog.max_label_width)
			}
			if (l.node) {
				bar.append(l.node)
			} else if (l.widget) {
				var widget = l.widget
				if (typeof l.widget === 'string') {
					widget = BarItems[l.widget]
				} else if (typeof l.widget === 'function') {
					widget = l.widget()
				}
				bar.append(widget.getNode())
				dialog.max_label_width = Math.max(getStringWidth(widget.name), dialog.max_label_width)
			}
			dialog_content.append(bar)
		} else {
			dialog_content.append(l)
		}
	})
}
function buildComponent(dialog) {
	let dialog_content = $(dialog.object).find('.dialog_content')
	let mount = $(`<div />`).appendTo(dialog_content)
	dialog.component.name = 'dialog-content'
	dialog.content_vue = new Vue(dialog.component).$mount(mount.get(0));
}


window.Dialog = class Dialog {
	constructor(id, options) {
		if (typeof id == 'object') {
			options = id;
			id = options.id;
		}
		this.id = options.id
		this.title = options.title
		
		this.lines = options.lines
		this.form = options.form
		this.component = options.component
		this.part_order = options.part_order || (options.form_first ? ['form', 'lines', 'component'] : ['lines', 'form', 'component'])

		this.width = options.width
		this.draggable = options.draggable
		this.singleButton = options.singleButton
		this.buttons = options.buttons
		this.form_first = options.form_first;
		this.confirmIndex = options.confirmIndex||0;
		this.cancelIndex = options.cancelIndex !== undefined ? options.cancelIndex : 1;
	
		this.confirmEnabled = options.confirmEnabled === false ? false : true
		this.cancelEnabled = options.cancelEnabled === false ? false : true
		this.onConfirm = options.onConfirm ? options.onConfirm : this.hide
		this.onCancel = options.onCancel ? options.onCancel : this.hide
		this.onButton = options.onButton;
		this.onFormChange = options.onFormChange;
	
		this.object;
	}
	confirm() {
		$(this.object).find('.confirm_btn:not([disabled])').click()
	}
	cancel() {
		$(this.object).find('.cancel_btn:not([disabled])').click()
	}
	updateFormValues(initial) {
		let form_result = this.getFormResult();
		for (var form_id in this.form) {
			let data = this.form[form_id];
			if (typeof data == 'object' && data.bar) {
				let show = Condition(data.condition, form_result);
				data.bar.toggle(show);
			}
		}
		if (!initial && typeof this.onFormChange == 'function') {
			this.onFormChange(form_result)
		}
	}
	getFormResult() {
		var result = {}
		if (this.form) {
			for (var form_id in this.form) {
				var data = this.form[form_id]
				if (typeof data === 'object') {
					switch (data.type) {
						default:
							result[form_id] = data.bar.find('input#'+form_id).val()
							break;
						case 'info':
							break;
						case 'textarea':
							result[form_id] = data.bar.find('textarea#'+form_id).val()
							break;
						case 'select':
							result[form_id] = data.bar.find('select#'+form_id+' > option:selected').attr('id')
							break;
						case 'radio':
							result[form_id] = data.bar.find('.form_part_radio#'+form_id+' input:checked').attr('id')
							break;
						case 'number':
							result[form_id] = Math.clamp(parseFloat(data.bar.find('input#'+form_id).val())||0, data.min, data.max)
							break;
						case 'vector':
							result[form_id] = [];
							for (var i = 0; i < (data.dimensions || 3); i++) {
								let num = Math.clamp(parseFloat(data.bar.find(`input#${form_id}_${i}`).val())||0, data.min, data.max)
								result[form_id].push(num)
							}
							break;
						case 'color':
							result[form_id] = data.colorpicker.get();
							break;
						case 'checkbox':
							result[form_id] = data.bar.find('input#'+form_id).is(':checked')
							break;
					}
				}
			}
		}
		return result;
	}
	build() {
		let scope = this;
		var jq_dialog = $(`<dialog class="dialog paddinged" id="${this.id}">
				<div class="dialog_handle">${tl(this.title)}</div>
				<content class="dialog_content"></content>
			</dialog>`)
		this.object = jq_dialog.get(0)
		this.max_label_width = 0;


		this.part_order.forEach(part => {
			if (part == 'form' && this.form) buildForm(this);
			if (part == 'lines' && this.lines) buildLines(this);
			if (part == 'component' && this.component) buildComponent(this);
		})

		if (this.max_label_width) {
			document.styleSheets[0].insertRule('.dialog#'+this.id+' .dialog_bar label {width: '+(this.max_label_width+8)+'px}')
		}
		if (this.buttons) {

			var buttons = []

			this.buttons.forEach((b, i) => {
				var btn = $('<button type="button">'+tl(b)+'</button> ')
				buttons.push(btn)
				if (typeof this.onButton == 'function') {
					btn.click((event) => {
						this.onButton(i);
					})
				}
			})
			buttons[this.confirmIndex] && buttons[this.confirmIndex].addClass('confirm_btn')
			buttons[this.cancelIndex] && buttons[this.cancelIndex].addClass('cancel_btn')
			let bar = $('<div class="dialog_bar button_bar"></div>');
			jq_dialog.append(bar);
			buttons.forEach((button, i) => {
				if (i) bar.append('&nbsp;')
				bar.append(button)
			})

		} else if (this.singleButton) {

			jq_dialog.append('<div class="dialog_bar button_bar" hidden>' +
				'<button type="button" class="cancel_btn confirm_btn"'+ (this.confirmEnabled ? '' : ' disabled') +'>'+tl('dialog.close')+'</button>' +
			'</div>')

		} else {

			jq_dialog.append(`<div class="dialog_bar button_bar">
				<button type="button" class="confirm_btn${this.confirmEnabled ? '' : ' disabled'}">${tl('dialog.confirm')}</button>&nbsp;
				<button type="button" class="cancel_btn${this.cancelEnabled ? '' : ' disabled'}">${tl('dialog.cancel')}</button>
			</div>`)

		}
		jq_dialog.append('<div class="dialog_close_button" onclick="$(\'.dialog#\'+open_dialog).find(\'.cancel_btn:not([disabled])\').click()"><i class="material-icons">clear</i></div>')
		var confirmFn = function(e) {

			let result = scope.getFormResult();
			scope.onConfirm(result, e);
		}
		confirmFn.bind(this)
		if (this.confirmEnabled) $(this.object).find('.confirm_btn').click(confirmFn)
		if (this.cancelEnabled) $(this.object).find('.cancel_btn').click(() => {this.onCancel()})
		//Draggable
		if (this.draggable !== false) {
			jq_dialog.addClass('draggable')
			jq_dialog.draggable({
				handle: ".dialog_handle",
				containment: '#page_wrapper'
			})
			var x = Math.clamp((window.innerWidth-540)/2, 0, 2000)
			jq_dialog.css('left', x+'px')
			jq_dialog.css('position', 'absolute')
		}
		return this;
	}
	show() {
		// Hide previous
		if (window.open_interface && typeof open_interface.hide == 'function') {
			open_interface.hide();
		}
		$('.dialog').hide(0);

		if (!this.object) {
			this.build();
		}

		let jq_dialog = $(this.object);

		$('#plugin_dialog_wrapper').append(jq_dialog);
		$('#blackout').fadeIn(0);
		jq_dialog.show().css('display', 'flex');
		jq_dialog.css('top', limitNumber(window.innerHeight/2-jq_dialog.height()/2, 0, 100)+'px');
		if (this.width) {
			jq_dialog.css('width', this.width+'px');
		}
		let first_focus = jq_dialog.find('.focusable_input').first();
		if (first_focus) first_focus.focus();

		open_dialog = this.id;
		open_interface = this;
		Prop.active_panel = 'dialog';
		return this;
	}
	hide() {
		$('#blackout').fadeOut(0)
		$(this.object).fadeOut(0)
			.find('.tool').detach()
		open_dialog = false;
		open_interface = false;
		Prop.active_panel = undefined
		$(this.object).detach()
		return this;
	}
	delete() {
		$(this.object).remove()
		if (this.content_vue) {
			this.content_vue.$destroy();
			delete this.content_vue;
		}
	}
	getFormBar(form_id) {
		var bar = $(this.object).find(`.form_bar_${form_id}`)
		if (bar.length) return bar;
	}
}

})()
