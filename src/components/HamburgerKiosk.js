import React, { useState } from "react";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import { arrayMoveImmutable } from "array-move";
import "./Kiosk.css";

// 개별 메뉴 항목을 드래그 가능하게 만드는 SortableElement
const SortableMenuItem = SortableElement(({ item, updateMenuItem, deleteMenuItem }) => {

  return (
    <div className="menu-item">
      <div className="admin-buttons">
        <input
          type="file"
          onChange={(e) => updateMenuItem(item.id, "image", URL.createObjectURL(e.target.files[0]))}
          className="menu-item-upload"
        />
        <button onClick={() => deleteMenuItem(item.id)} className="delete-btn">삭제</button>
      </div>
      <img src={item.image || "default-image.jpg"} alt={item.name} className="menu-item-image" />
      <h3 className="menu-item-name">
        <input
          type="text"
          value={item.name}
          onChange={(e) => updateMenuItem(item.id, "name", e.target.value)}
          className="menu-item-input"
          placeholder="메뉴 이름"
        />
      </h3>
      <p className="menu-item-price">
        <input
          type="number"
          value={item.price}
          onChange={(e) => updateMenuItem(item.id, "price", Number(e.target.value))}
          className="menu-item-input"
          step="100"
          placeholder="가격"
        />
      </p>
    </div>
  );
});

// 전체 메뉴 그리드를 드래그 가능하게 만드는 SortableContainer
const SortableMenuGrid = SortableContainer(({ items, updateMenuItem, deleteMenuItem }) => {
  return (
    <div className="menu-grid">
      {items.map((item, index) => (
        <SortableMenuItem
          key={item.id}
          index={index}
          item={item}
          updateMenuItem={updateMenuItem}
          deleteMenuItem={deleteMenuItem}
        />
      ))}
    </div>
  );
});

const CafeKiosk = ({ isAdminMode }) => {
  const [categories, setCategories] = useState(["카테고리1", "카테고리2", "카테고리3"]);
  const [selectedCategory, setSelectedCategory] = useState("커피");
  const [menuItems, setMenuItems] = useState([
    { id: 1, category: "커피", name: "아메리카노", price: 4000, image: "" },
    { id: 2, category: "티", name: "얼그레이", price: 4500, image: "" },
    { id: 3, category: "스무디", name: "딸기 스무디", price: 5500, image: "" },
  ]);

  const handleCategoryChange = (category) => setSelectedCategory(category);

  const addMenuItem = () => {
    const newItem = {
      id: Date.now(),
      category: selectedCategory,
      name: "새로운 메뉴",
      price: 0,
      image: "",
    };
    setMenuItems([...menuItems, newItem]);
  };

  const deleteMenuItem = (id) => setMenuItems(menuItems.filter(item => item.id !== id));

  const updateMenuItem = (id, key, value) => {
    setMenuItems(menuItems.map(item => item.id === id ? { ...item, [key]: value } : item));
  };

  const onSortEnd = ({ oldIndex, newIndex }) => {
    const filteredItems = menuItems.filter(item => item.category === selectedCategory);
    const movedItems = arrayMoveImmutable(filteredItems, oldIndex, newIndex);

    const updatedMenuItems = menuItems.map(item =>
      item.category === selectedCategory ? movedItems.shift() || item : item
    );

    setMenuItems(updatedMenuItems);
  };

  // 카테고리 추가, 삭제 및 수정 함수
  const addCategory = () => {
    const newCategory = prompt("새 카테고리 이름을 입력하세요:");
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
    }
  };

  const deleteCategory = (category) => {
    if (window.confirm(`${category} 카테고리를 삭제하시겠습니까?`)) {
      setCategories(categories.filter((cat) => cat !== category));
      setMenuItems(menuItems.filter(item => item.category !== category));
      if (selectedCategory === category) setSelectedCategory(categories[0] || "");
    }
  };

  const renameCategory = (category) => {
    const newCategoryName = prompt("새 카테고리 이름을 입력하세요:", category);
    if (newCategoryName && newCategoryName !== category && !categories.includes(newCategoryName)) {
      setCategories(categories.map(cat => (cat === category ? newCategoryName : cat)));
      setMenuItems(menuItems.map(item => item.category === category ? { ...item, category: newCategoryName } : item));
    }
  };

  return (
    <div className="kiosk-container">
      <h2 className="kiosk-title">햄버거 메뉴</h2>

      <div className="category-selector">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-btn ${category === selectedCategory ? "active" : ""}`}
            onClick={() => handleCategoryChange(category)}
            onDoubleClick={() => isAdminMode && renameCategory(category)} // 관리자 모드에서 더블 클릭 시 카테고리 이름 변경
          >
            {category}
          </button>
        ))}
      </div>

      {isAdminMode && (
        <div className="admin-controls">
          <button className="add-category-btn" onClick={addCategory}>카테고리 추가</button>
          <button className="delete-category-btn" onClick={() => deleteCategory(selectedCategory)}>카테고리 삭제</button>
          <button className="add-menu-btn" onClick={addMenuItem}>메뉴 추가</button>
          <p className="admin-tip">드래그 앤 드롭으로 메뉴를 재배치하세요.</p>
        </div>
      )}

      {isAdminMode ? (
        <SortableMenuGrid
          items={menuItems.filter(item => item.category === selectedCategory)}
          onSortEnd={onSortEnd} // 관리자 모드일 때만 onSortEnd 적용
          updateMenuItem={updateMenuItem}
          deleteMenuItem={deleteMenuItem}
          axis="y"
          transitionDuration={0}
          pressDelay={200} // 관리자 모드일 때만 드래그가 활성화됨
        />
      ) : (
        // 사용자 모드에서는 단순히 그리드만 표시 (드래그 비활성화)
        <div className="menu-grid">
          {menuItems.filter(item => item.category === selectedCategory).map((item) => (
            <div key={item.id} className="menu-item">
              <img src={item.image || "default-image.jpg"} alt={item.name} className="menu-item-image" />
              <h3 className="menu-item-name">{item.name}</h3>
              <p className="menu-item-price">₩{item.price.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CafeKiosk;
