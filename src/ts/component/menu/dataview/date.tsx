import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MenuItemVertical } from 'ts/component';
import { I, C, Key, keyboard, Util, DataUtil } from 'ts/lib';
import { menuStore, dbStore } from 'ts/store';
import { observer } from 'mobx-react';

interface Props extends I.Menu {}

const $ = require('jquery');

const MenuDataviewDate = observer(class MenuDataviewDate extends React.Component<Props, {}> {

	_isMounted: boolean = false;
	n: number = 0;

	render () {
		const sections = this.getSections();

		const Section = (item: any) => (
			<div>
				{item.name ? <div className="sectionName">{item.name}</div> : ''}
				<div className="items">
					{item.children.map((action: any, i: number) => (
						<MenuItemVertical 
							key={i} 
							{...action} 
							onMouseEnter={(e: any) => { this.onMouseEnter(e, action); }} 
						/>
					))}
				</div>
			</div>
		);

		return (
			<div className="items">
				{sections.map((item: any, i: number) => (
					<Section key={i} {...item} />
				))}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
		this.rebind();
	};

	componentDidUpdate () {
		this.props.setActive();
		this.props.position();
	};
	
	componentWillUnmount () {
		this._isMounted = false;
		this.unbind();
	};

	rebind () {
		if (!this._isMounted) {
			return;
		};
		
		this.unbind();
		
		const win = $(window);
		win.on('keydown.menu', (e: any) => { this.onKeyDown(e); });
	};
	
	unbind () {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));

		win.unbind('keydown.menu');
		node.find('.items').unbind('scroll.menu');
	};

	getSections () {
		const { param } = this.props;
		const { data } = param;
		const { rootId, getView, relationKey } = data;

		let relation = null;
		let dateFormat = null;
		let timeFormat = null;

		if (getView) {
			const view = getView();
			relation = view.getRelation(relationKey);
		} else {
			relation = dbStore.getRelation(rootId, rootId, relationKey);
		};

		if (!relation) {
			return [];
		};

		if (relation) {
			const dateOptions = this.getOptions('dateFormat');
			const timeOptions = this.getOptions('timeFormat');

			dateFormat = dateOptions.find((it: any) => { return it.id == relation.dateFormat; }) || dateOptions[0];
			timeFormat = timeOptions.find((it: any) => { return it.id == relation.timeFormat; }) || timeOptions[0];
		};

		let sections = [
			{ 
				id: 'date', name: 'Date format', children: [
					{ id: 'dateFormat', name: dateFormat?.name, arrow: true }
				] 
			},
			{ 
				id: 'time', name: 'Time format', children: [
					{ id: 'timeFormat', name: timeFormat?.name, arrow: true }
				] 
			},
		];

		sections = DataUtil.menuSectionsMap(sections);
		return sections;
	};
	
	getItems () {
		const sections = this.getSections();
		
		let items: any[] = [];
		for (let section of sections) {
			items = items.concat(section.children);
		};
		
		return items;
	};

	getOptions (key: string) {
		let options = [];
		switch (key) {
			case 'dateFormat':
				options = [
					{ id: I.DateFormat.MonthAbbrBeforeDay, name: Util.date('M d, Y', Util.time()) },
					{ id: I.DateFormat.MonthAbbrAfterDay, name: Util.date('d M, Y', Util.time()) },
					{ id: I.DateFormat.Short, name: Util.date('d.m.Y', Util.time()) },
					{ id: I.DateFormat.ShortUS, name: Util.date('m.d.Y', Util.time()) },
					{ id: I.DateFormat.ISO, name: Util.date('Y-m-d', Util.time()) },
				];
				break;

			case 'timeFormat':
				options = [
					{ id: I.TimeFormat.H12, name: '12 hour' },
					{ id: I.TimeFormat.H24, name: '24 hour' },
				];
				break;
		};
		return options;
	};
	
	onKeyDown (e: any) {
		if (!this._isMounted) {
			return;
		};
		
		e.stopPropagation();

		const k = e.key.toLowerCase();
		keyboard.disableMouse(true);
		
		const { setActive } = this.props;
		const items = this.getItems();
		const l = items.length;
		const item = items[this.n];
		
		switch (k) {
			case Key.up:
				e.preventDefault();
				this.n--;
				if (this.n < 0) {
					this.n = l - 1;
				};
				setActive(null, true);
				break;
				
			case Key.down:
				e.preventDefault();
				this.n++;
				if (this.n > l - 1) {
					this.n = 0;
				};
				setActive(null, true);
				break;
				
			case Key.tab:
			case Key.enter:
				e.preventDefault();
				if (item) {
					this.onOver(e, item);
				};
				break;
				
			case Key.escape:
				this.props.close();
				break;
		};
	};

	onOver (e: any, item: any) {
		const { param, getId, getSize, close } = this.props;
		const { data, classNameWrap } = param;
		const { rootId, blockId, relationKey, getView } = data;

		let relation = null;
		let view = null;
		let idx = 0;

		if (getView) {
			view = getView();
			idx = view.relations.findIndex((it: I.ViewRelation) => { return it.relationKey == relationKey; });

			relation = view.getRelation(relationKey);
		} else {
			relation = dbStore.getRelation(rootId, rootId, relationKey);
		};

		const options = this.getOptions(item.itemId);
		const value = options.find((it: any) => { return it.id == relation[item.itemId]; }) || options[0];

		menuStore.open('select', {
			element: `#${getId()} #item-${item.id}`,
			offsetX: getSize().width,
			offsetY: -38,
			isSub: true,
			passThrough: true,
			classNameWrap: classNameWrap,
			data: {
				value: value.id,
				options: options,
				onSelect: (e: any, el: any) => {
					if (view) {
						view.relations[idx][item.itemId] = el.id;
						C.BlockDataviewViewUpdate(rootId, blockId, view.id, view);
					};
					close();
				}
			}
		});
	};

	onMouseEnter (e: any, item: any) {
		if (!keyboard.isMouseDisabled) {
			this.props.setActive(item, false);
			this.onOver(e, item);
		};
	};

});

export default MenuDataviewDate;