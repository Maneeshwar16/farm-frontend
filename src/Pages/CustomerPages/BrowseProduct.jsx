import React from 'react'
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const BrowseProduct = () => {
    const location = useLocation();
    const user = location.state?.user;
    /*const navigate = useNavigate;*/
  return (
    <div>
      <h1>Heyy {user?.name}</h1>
      <h1>This is browse prodcuts page</h1>
    </div>
  )
}

export default BrowseProduct
