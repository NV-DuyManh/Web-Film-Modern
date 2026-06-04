import React from 'react';
import HeaderClient from '../../components/client/HeaderClient';
import ClientRouters from '../../routers/ClientRouters';

function LayoutClient(props) {
    return (
        <div>
        <HeaderClient/>
        <ClientRouters/>
        </div>
    );
}

export default LayoutClient;    