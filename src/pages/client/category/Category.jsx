import React, { useContext, useState } from "react";
import { CategoriesContext } from "../../../contexts/CategoryProvider";

function Category({ openCate }) {
    const categories = useContext(CategoriesContext);
    return (
        <div className={`${openCate ? "" : "hidden"} p-2 rounded-xl z-10 absolute bg-black w-60 top-10`}>    
          <div className="grid grid-cols-2 gap-2 ">
            {categories.map((e) => (
                <div className="col-span-1 cursor-pointer text-white p-2 hover:text-amber-300  ">
                    {e.name}
                </div>
            ))}
        </div>
        </div>
    );
}

export default Category;
