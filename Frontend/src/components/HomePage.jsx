import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TbPokeball } from "react-icons/tb";
import { FaSearch } from "react-icons/fa";
import { IoEnterOutline } from "react-icons/io5";


const MAX_POKEMON = 151;

function HomePage() {
  const [allPokemons, setAllPokemons] = useState([]);
  const [filteredPokemons, setFilteredPokemons] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('number');
  const [notFound, setNotFound] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`https://pokeapi.co/api/v2/pokemon?limit=${MAX_POKEMON}`)
      .then((response) => response.json())
      .then((data) => {
        setAllPokemons(data.results);
        setFilteredPokemons(data.results);
      });
  }, []);

  useEffect(() => {
    handleSearch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterType, allPokemons]);

  const fetchPokemonDataBeforeRedirect = async (id) => {
    try {
      await Promise.all([
        fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then((res) => res.json()),
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`).then((res) => res.json()),
      ]);
      return true;
    } catch (error) {
      console.error("Failed to fetch Pokemon data before redirect");
      return false;
    }
  };

  const handleSearch = () => {
    let filtered;

    if (searchTerm === '') {
      filtered = [...allPokemons];
    } else if (filterType === 'number') {
      filtered = allPokemons.filter((pokemon) => {
        const pokemonID = pokemon.url.split("/")[6];
        return pokemonID.startsWith(searchTerm);
      });
    } else if (filterType === 'name') {
      filtered = allPokemons.filter((pokemon) =>
        pokemon.name.toLowerCase().startsWith(searchTerm.toLowerCase())
      );
    } else {
      filtered = [...allPokemons];
    }

    setFilteredPokemons(filtered);
    setNotFound(filtered.length === 0);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilteredPokemons(allPokemons);
    setNotFound(false);
  };

  const handleSortIconClick = () => {
    setIsFilterOpen(!isFilterOpen);
    document.body.classList.toggle('filter-wrapper-overlay');
  };

  const handlePokemonClick = async (pokemonID) => {
    const success = await fetchPokemonDataBeforeRedirect(pokemonID);
    if (success) {
      navigate(`/detail/${pokemonID}`);
    }
  };

  return (
    <main className="main">
      <header className="header home">
        <div className="container">
          <div className="logo-wrapper">
            
            <TbPokeball className='text-2xl mr-1.5 text-amber-50' />
            <h1 className=''>Pokedex</h1>
          </div>
          <div className="search-wrapper">
            <div className="search-wrap">
            <FaSearch className='ml-4' />
            
            
              <input
                type="text"
                className="search-input body3-fonts"
                placeholder="Search"
                id="search-input"
                value={searchTerm}
                onChange={handleInputChange}
              />
              <img
                src="/assets/cross.svg"
                alt="cross icon"
                className={`search-close-icon ${searchTerm !== "" ? "search-close-icon-visible" : ""}`}
                id="search-close-icon"
                onClick={clearSearch}
              />
            </div>
            <div className="sort-wrapper">
              <div className="sort-wrap">
              <IoEnterOutline />
              </div>
              <div className={`filter-wrapper ${isFilterOpen ? "filter-wrapper-open" : ""}`}>
                <p className="body2-fonts">Sort by:</p>
                <div className="filter-wrap">
                  <div>
                    <input
                      type="radio"
                      id="number"
                      name="filters"
                      value="number"
                      checked={filterType === 'number'}
                      onChange={() => setFilterType('number')}
                    />
                    <label htmlFor="number" className="body3-fonts">Number</label>
                  </div>
                  <div>
                    <input 
                      type="radio" 
                      id="name" 
                      name="filters" 
                      value="name" 
                      checked={filterType === 'name'}
                      onChange={() => setFilterType('name')}
                    />
                    <label htmlFor="name" className="body3-fonts">Name</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <section className="pokemon-list">
        <div className="container">
          <div className="list-wrapper">
            {filteredPokemons.map((pokemon) => {
              const pokemonID = pokemon.url.split("/")[6];
              return (
                <div 
                  className="list-item" 
                  key={pokemonID}
                  onClick={() => handlePokemonClick(pokemonID)}
                >
                  <div className="number-wrap">
                    <p className="caption-fonts">#{pokemonID}</p>
                  </div>
                  <div className="img-wrap">
                    <img 
                      src={`https://raw.githubusercontent.com/pokeapi/sprites/master/sprites/pokemon/other/dream-world/${pokemonID}.svg`} 
                      alt={pokemon.name} 
                    />
                  </div>
                  <div className="name-wrap">
                    <p className="body3-fonts">{pokemon.name}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div id="not-found-message" style={{ display: notFound ? 'block' : 'none' }}>
          Pokemon not found
        </div>
      </section>
    </main>
  );
}

export default HomePage;