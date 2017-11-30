import ItemView from 'components/ItemView';

let itemView;

describe('ItemView', () => {
    before(() => {
        itemView = new ItemView();
        itemView.render();
    });
});
