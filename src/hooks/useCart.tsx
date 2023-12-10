import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]

      const productExists = updatedCart.find(product => product.id === productId)

      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount
      const currentAmount = productExists ? productExists.amount : 0
      const amount = currentAmount + 1

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExists) {
        productExists.amount += 1
      } else {
        const product = await api.get(`/products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1
        }

        updatedCart.push(newProduct)
      }

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      setCart(updatedCart)
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart]

      const productExists = updatedCart.find(product => product.id === productId)

      if (!productExists) {
        toast.error('Erro na remoção do produto');
        return
      }

      updatedCart.filter(product => product.id != productId)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      setCart(updatedCart)
    } catch {

    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount <= 0) {
      return
    }

    try {
      const stock = await api.get<UpdateProductAmount>(`/stock/${productId}`);
      const possibleAmount = stock.data.amount

      if (amount > possibleAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const updatedCart = [...cart]

      const productExists = updatedCart.find(product => product.id === productId)

      if (productExists) {
        productExists.amount = amount
      }

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      setCart(updatedCart)
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
