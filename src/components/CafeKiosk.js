import React, { useState, useEffect } from "react";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import { arrayMoveImmutable } from "array-move";
import "./Kiosk.css";
import { db, storage } from "../firebase";
import { doc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth } from "../firebase";

// 한 페이지에 표시할 메뉴 수
const ITEMS_PER_PAGE = 4;

// 개별 메뉴 항목을 드래그 가능하게 만드는 SortableElement
const SortableMenuItem = SortableElement(({ item, updateMenuItem, deleteMenuItem }) => {
  return (
    <div className="menu-item">
      <div className="admin-buttons">
        <input
          type="file"
          onChange={(e) => updateMenuItem(item.id, "image", e.target.files[0])}
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

const CafeKiosk = ({ isAdminMode, userEmail }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null); // 초기 선택된 카테고리 없음
  const [menuItems, setMenuItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(0); // 현재 페이지 번호

  // Firestore에서 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      const userEmail = auth.currentUser?.email;
      if (!userEmail) return;

      const userDocRef = doc(db, "users", userEmail);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCategories(data.categories || ["카테고리1", "카테고리2", "카테고리3"]);
        setMenuItems(data.menuItems || []);
        setSelectedCategory(data.categories ? data.categories[0] : "카테고리1"); // 첫 번째 카테고리 선택
      }
    };
    fetchData();
  }, [userEmail]);

  const handleCategoryChange = (category) => setSelectedCategory(category);

  // 현재 페이지에 표시할 메뉴 아이템 필터링
  const paginatedMenuItems = menuItems
    .filter(item => item.category === selectedCategory)
    .slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const addMenuItem = async () => {
    const newItem = {
      id: Date.now(),
      category: selectedCategory,
      name: "새로운 메뉴",
      price: 0,
      image: "",
    };
    const updatedItems = [...menuItems, newItem];
    setMenuItems(updatedItems);

    const userEmail = auth.currentUser?.email;
    if (userEmail) {
      const userDocRef = doc(db, "users", userEmail);
      await updateDoc(userDocRef, {
        menuItems: arrayUnion(newItem),
      });
    }
  };

  const deleteMenuItem = async (id) => {
    const updatedItems = menuItems.filter(item => item.id !== id);
    setMenuItems(updatedItems);

    const userEmail = auth.currentUser?.email;
    if (userEmail) {
      const userDocRef = doc(db, "users", userEmail);
      await updateDoc(userDocRef, {
        menuItems: updatedItems,
      });
    }
  };

  const updateMenuItem = async (id, key, value) => {
    const updatedItems = menuItems.map(item =>
      item.id === id ? { ...item, [key]: value } : item
    );
    setMenuItems(updatedItems);

    const userEmail = auth.currentUser?.email;
    if (userEmail) {
      const userDocRef = doc(db, "users", userEmail);
      await updateDoc(userDocRef, { menuItems: updatedItems });
    }
  };

  const handleImageUpload = async (id, file) => {
    const userEmail = auth.currentUser?.email;
    if (!userEmail) return;

    const storageRef = ref(storage, `users/${userEmail}/images/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    updateMenuItem(id, "image", downloadURL);
  };

  const onSortEnd = ({ oldIndex, newIndex }) => {
    const filteredItems = menuItems.filter(item => item.category === selectedCategory);
    const movedItems = arrayMoveImmutable(filteredItems, oldIndex, newIndex);

    const updatedMenuItems = menuItems.map(item =>
      item.category === selectedCategory ? movedItems.shift() || item : item
    );
    setMenuItems(updatedMenuItems);
  };

  const addCategory = () => {
    const newCategory = prompt("새 카테고리 이름을 입력하세요:");
    if (newCategory && !categories.includes(newCategory)) {
      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);
    }
  };

  const deleteCategory = (category) => {
    if (window.confirm(`${category} 카테고리를 삭제하시겠습니까?`)) {
      const updatedCategories = categories.filter((cat) => cat !== category);
      const updatedItems = menuItems.filter(item => item.category !== category);
      setCategories(updatedCategories);
      setMenuItems(updatedItems);
    }
  };

  const renameCategory = (category) => {
    const newCategoryName = prompt("새 카테고리 이름을 입력하세요:", category);
    if (newCategoryName && newCategoryName !== category && !categories.includes(newCategoryName)) {
      const updatedCategories = categories.map(cat => (cat === category ? newCategoryName : cat));
      setCategories(updatedCategories);
    }
  };

  // 페이지 전환 핸들러
  const handleNextPage = () => {
    if ((currentPage + 1) * ITEMS_PER_PAGE < menuItems.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="kiosk-container">
      <h2 className="kiosk-title">카페 메뉴</h2>

      <div className="category-selector">
        {categories.map((category) => (
          <button
            key={category}
            className={`category-btn ${category === selectedCategory ? "active" : ""}`}
            onClick={() => handleCategoryChange(category)}
            onDoubleClick={() => isAdminMode && renameCategory(category)}
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
          <p className="admin-tip">드래그 앤 드롭으로 메뉴를 재배치하세요.</p> {/* 안내 문구 추가 */}
        </div>
      )}


      <div className="pagination-controls">
        <button onClick={handlePrevPage} disabled={currentPage === 0}>
          ⬅️
        </button>
        {Array.from({ length: Math.ceil(menuItems.filter(item => item.category === selectedCategory).length / ITEMS_PER_PAGE) })
          .map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={currentPage === index ? 'active' : ''}
            >
              {index + 1}
            </button>
          ))}
        <button onClick={handleNextPage} disabled={(currentPage + 1) * ITEMS_PER_PAGE >= menuItems.length}>
          ➡️
        </button>
      </div>


      {isAdminMode ? (
        <SortableMenuGrid
          items={paginatedMenuItems}
          onSortEnd={onSortEnd}
          updateMenuItem={(id, key, value) => {
            if (key === "image") {
              handleImageUpload(id, value);
            } else {
              updateMenuItem(id, key, value);
            }
          }}
          deleteMenuItem={deleteMenuItem}
          axis="y"
          transitionDuration={0}
          pressDelay={200}
        />
      ) : (
        <div className="menu-grid">
          {paginatedMenuItems.map((item) => (
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
