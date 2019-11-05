import * as React from 'react';
import { InputWithFile } from 'ts/component';
import { I, keyBoard } from 'ts/lib';
import { observer, inject } from 'mobx-react';

interface Props extends I.BlockText {
	blockStore?: any;
};

@inject('blockStore')
@observer
class BlockFile extends React.Component<Props, {}> {

	constructor (props: any) {
		super(props);
		
	};

	render () {
		const { blockStore, header } = this.props;
		const { blocks } = blockStore;
		const block = blocks.find((item: I.Block) => { return item.header.id == header.id; });
		
		if (!block) {
			return null;
		};
		
		const { content } = block;
		
		return (
			<React.Fragment>
				<InputWithFile icon="file" textFile="Upload a file" />
			</React.Fragment>
		);
	};
	
};

export default BlockFile;