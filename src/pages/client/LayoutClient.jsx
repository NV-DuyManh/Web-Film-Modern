import React from 'react';
import HeaderClient from '../../components/client/HeaderClient';
import ClientRouters from '../../routers/ClientRouters';
import FooterClient from '../../components/client/FooterClient';

function LayoutClient(props) {
    return (
        <div>
            <HeaderClient />
            <ClientRouters />
            <FooterClient />
        </div>
    );
}

export default LayoutClient;    
